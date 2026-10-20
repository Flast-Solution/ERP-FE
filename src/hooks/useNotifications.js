import { useCallback, useEffect, useRef, useState } from 'react';
import useGetMe from './useGetMe';
import { notificationUserKey, useEntityAlertStore } from '@/features/Alerts/entityAlertStore';
import { applyAction, awaken } from '@/features/Alerts/model';
import { fetchNotifications, createAlertTask, notificationAction, fetchAlertDetails, normalizeNotification } from '@/features/Alerts/service';

export const useNotifications = () => {
 const {user}=useGetMe();
 const key=notificationUserKey(user);
 const activeKey=useRef(key); activeKey.current=key;
 const inFlight=useRef(null);
 const detailRequests=useRef(new Map());
 const [store,setStore]=useState({key,state:{alerts:[],tasks:[]}});
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState(null);
 const state=store.key===key?store.state:{alerts:[],tasks:[]};
 useEffect(()=>{useEntityAlertStore.setState({key,alerts:store.key===key?store.state.alerts:[]});},[key,store]);
 useEffect(()=>{
  const publish=()=>window.dispatchEvent(new CustomEvent('ERP_ENTITY_ALERTS_UPDATED',{detail:store.key===key?store.state.alerts.map(alert=>({id:alert.entityData?.id,kind:alert.entityData?.kind})):[]}));
  window.addEventListener('ERP_ENTITY_ALERTS_REQUEST',publish);
  publish();
  return()=>window.removeEventListener('ERP_ENTITY_ALERTS_REQUEST',publish);
 },[key,store]);
 const stateRef=useRef(state);stateRef.current=state;
 const actionPending=useRef(false);
 const [acting,setActing]=useState(false);
 const refresh=useCallback(async()=>{
  if (!user?.bizId) return;
  if (inFlight.current?.key===key) return inFlight.current.promise;
  setLoading(true); setError(null);
  const request={key}; inFlight.current=request;
  request.promise=(async()=>{
   try {
    const alerts=await fetchNotifications();
    if(activeKey.current!==key||inFlight.current!==request)return;
    setStore(previous=>({key,state:{tasks:previous.key===key?previous.state.tasks:[],alerts:alerts.map(alert=>{
     const old=previous.key===key?previous.state.alerts.find(item=>item.id===alert.id):null;
     return old?.read?{...alert,read:true}:alert;
    })}}));
   } catch (failure) {
    if(activeKey.current===key&&inFlight.current===request)setError(failure?.message||'Không tải được danh sách cảnh báo.');
   } finally {
    if(activeKey.current===key&&inFlight.current===request){setLoading(false);inFlight.current=null;}
   }
  })();
  return request.promise;
 },[key,user?.bizId]);
 useEffect(()=>{
  setStore({key,state:{alerts:[],tasks:[]}}); setLoading(false);setError(null);setActing(false);
  refresh();
  return()=>{if(inFlight.current?.key===key)inFlight.current=null;};
 },[key,refresh]);
 useEffect(()=>{const tick=()=>setStore(previous=>previous.key===key?{key,state:awaken(previous.state)}:previous);const timer=setInterval(tick,15000);return()=>clearInterval(timer);},[key]);
 const update=fn=>setStore(previous=>({key,state:fn(previous.key===key?previous.state:{alerts:[],tasks:[]})}));
 const loadTasks=useCallback(async id=>{
  if(id==null)return;
  const ids=[id];
  const results=await Promise.allSettled(ids.map(alertId=>{
   const requestKey=`${key}:${alertId}`;
   if(detailRequests.current.has(requestKey))return detailRequests.current.get(requestKey);
   const request=fetchAlertDetails(alertId).finally(()=>{if(detailRequests.current.get(requestKey)===request)detailRequests.current.delete(requestKey);});
   detailRequests.current.set(requestKey,request);
   return request;
  }));
  if(activeKey.current!==key)return;
  setStore(previous=>previous.key!==key?previous:{key,state:{...previous.state,alerts:previous.state.alerts.map(alert=>{const result=results.find((result,index)=>String(ids[index])===String(alert.id)&&result.status==='fulfilled'&&result.value.alert);return result?{...result.value.alert,read:alert.read,buckets:alert.buckets}:alert;}),tasks:results.reduce((tasks,result,index)=>result.status==='fulfilled'?[...tasks.filter(t=>String(t.alertId)!==String(ids[index])),...result.value.tasks]:tasks,previous.state.tasks)}});
  const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;
 },[key]);
 const act=async(id,action,payload={})=>{
  if(actionPending.current)throw new Error('Đang thực hiện thao tác, vui lòng đợi.');
  const alert=stateRef.current.alerts.find(a=>a.id===id);if(!alert)throw new Error('Không tìm thấy cảnh báo.');
  if(!['assign','ignore','snooze','approve','undo'].includes(action)){
   applyAction(stateRef.current,id,action,payload);update(current=>applyAction(current,id,action,payload));return;
  }
  actionPending.current=true;setActing(true);
  try {
   const data=action==='assign'?await createAlertTask(alert,payload):await notificationAction(alert,{ignore:'IGNORE',snooze:'REOPEN',approve:'APPROVE',undo:'UNDO'}[action],payload.reason,...(action==='snooze'?[payload.until]:[]));
   if(activeKey.current!==key)return;
   const saved=data?.alert ?? (data?.id===id&&data?.status?data:null);
   if(saved)setStore(previous=>previous.key!==key?previous:{key,state:{...previous.state,alerts:previous.state.alerts.map(item=>item.id===id?{...normalizeNotification(saved),read:item.read,buckets:item.buckets}:item)}});
   await refresh();
   if(action==='assign')try{await loadTasks(id);}catch(failure){setError(`Đã tạo việc, nhưng chưa tải được danh sách: ${failure.message}`);}
   return data;
  } finally {actionPending.current=false;if(activeKey.current===key)setActing(false);}
 };
 return {notifications:state.alerts,tasks:state.tasks,acting,loadTasks,
  act,
  markRead:a=>update(current=>applyAction(current,a.id,'read')),
  markAllRead:()=>update(current=>({...current,alerts:current.alerts.map(a=>({...a,read:true}))})),
  undoIgnore:id=>act(id,'undo'),
  completeTask:id=>update(current=>{const task=current.tasks.find(t=>t.id===id);if(!task)return current;const next={...current,tasks:current.tasks.map(t=>t.id===id?{...t,status:'done'}:t)};return {...next,alerts:next.alerts.map(a=>a.id===task.alertId&&!['resolved','ignored'].includes(a.status)?{...a,status:'resolved',history:[...a.history,{text:'Công việc hoàn thành · tự đóng cảnh báo',at:new Date().toISOString()}]}:a)};}),
  reset:refresh, refresh, loading:store.key===key&&loading, error:store.key===key?error:null,requestBrowserNotificationPermission:()=>{},
 };
};
