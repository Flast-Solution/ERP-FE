import { useEffect, useState } from 'react';
import useGetMe from './useGetMe';
import { initialState, applyAction, awaken } from '@/features/Alerts/model';
const PREFIX='erp-alert-demo-v1:';
function read(key) { try { const state=JSON.parse(localStorage.getItem(key)); if(Array.isArray(state?.alerts)&&Array.isArray(state?.tasks))return awaken(state); } catch {} return initialState(); }
export const useNotifications = () => {
 const {user}=useGetMe(); const key=`${PREFIX}${user?.bizId||'guest'}:${user?.id||'guest'}`;
 const [store,setStore]=useState(()=>({key,state:read(key)}));
 const state=store.key===key?store.state:read(key);
 useEffect(()=>{setStore({key,state:read(key)});},[key]);
 useEffect(()=>{if(store.key===key){try{localStorage.setItem(key,JSON.stringify(store.state));}catch{}}},[key,store]);
 useEffect(()=>{const tick=()=>setStore(previous=>previous.key===key?{key,state:awaken(previous.state)}:previous);const timer=setInterval(tick,15000);window.addEventListener('focus',tick);return()=>{clearInterval(timer);window.removeEventListener('focus',tick);};},[key]);
 const update=fn=>setStore(previous=>({key,state:fn(previous.key===key?previous.state:read(key))}));
 return {notifications:state.alerts,tasks:state.tasks,
  act:(id,action,payload)=>{applyAction(state,id,action,payload);update(current=>applyAction(current,id,action,payload));},
  markRead:a=>update(current=>applyAction(current,a.id,'read')),
  markAllRead:()=>update(current=>({...current,alerts:current.alerts.map(a=>({...a,read:true}))})),
  undoIgnore:(id,before)=>update(current=>({...current,alerts:current.alerts.map(a=>a.id===id&&a.status==='ignored'?before:a)})),
  completeTask:id=>update(current=>{const task=current.tasks.find(t=>t.id===id);if(!task)return current;const next={...current,tasks:current.tasks.map(t=>t.id===id?{...t,status:'done'}:t)};return {...next,alerts:next.alerts.map(a=>a.id===task.alertId&&!['resolved','ignored'].includes(a.status)?{...a,status:'resolved',history:[...a.history,{text:'Công việc hoàn thành · tự đóng cảnh báo',at:new Date().toISOString()}]}:a)};}),
  reset:()=>update(()=>initialState()),requestBrowserNotificationPermission:()=>{},
 };
};
