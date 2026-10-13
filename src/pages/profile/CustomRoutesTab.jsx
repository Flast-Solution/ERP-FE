import React,{useEffect,useState} from 'react';
import {Alert,Button,Card,Form,Input,Modal,Select,Space,Switch,Table,Tag,message} from 'antd';
import useGetMe from '@/hooks/useGetMe';
import authRoles from '@/auth/authRoles';
import {useTenantRoutes} from '@/features/TenantRoutes/Provider';
import {ROUTES,validateConfig} from '@/features/TenantRoutes/model';
import {saveConfig} from '@/features/TenantRoutes/service';
import {applyDevRemoteOverride} from '@/features/TenantRoutes/devOverrides';
import {loadRemoteFromUrl} from '@/utils/loadRemote';
export default function CustomRoutesTab(){
 const {user,hasRole}=useGetMe();const admin=hasRole([...authRoles.admin,...authRoles.partner]);const {status,config,error,refresh}=useTenantRoutes();
 const [draft,setDraft]=useState(null),[editor,setEditor]=useState(null),[saving,setSaving]=useState(false),[checking,setChecking]=useState(null);const [form]=Form.useForm();
 useEffect(()=>{setDraft(status==='ready'?JSON.parse(JSON.stringify(config)):null);setEditor(null);},[config,status,user?.bizId]);
 if(status==='loading')return <Card loading/>;
 if(status==='error')return <Alert type="error" message={error} action={<Button onClick={refresh}>Tải lại</Button>}/>;
 if(!draft)return null;
 const change=next=>setDraft({...draft,...next});
 const edit=(type,row)=>{setEditor({type,original:row?.id||row?.route});form.resetFields();form.setFieldsValue(row||{enabled:true,version:''});};
 const persist=async()=>{if(!admin)return;try{validateConfig(draft,user.bizId);setSaving(true);await saveConfig(user.bizId,draft);await refresh();message.success('Đã lưu cấu hình route');}catch(e){message.error(e.message);}finally{setSaving(false);}};
 const submit=values=>{if(!admin)return;try{let next;if(editor.type==='remote')next={...draft,remotes:[...draft.remotes.filter(r=>r.id!==editor.original),values]};else next={...draft,routes:[...draft.routes.filter(r=>r.route!==editor.original),values]};validateConfig(next,user.bizId);setDraft(next);setEditor(null);}catch(e){message.error(e.message);}};
 const check=async row=>{setChecking(row.route);try{const remote=applyDevRemoteOverride(draft.remotes.find(r=>r.id===row.remoteId));const loaded=await loadRemoteFromUrl({name:`remote_${encodeURIComponent(`${remote.scope}:${remote.remoteEntry}:${remote.version||''}`)}`,entry:remote.remoteEntry,scope:remote.scope,module:row.module,version:remote.version,force:true});if(!loaded?.default)throw new Error('Module thiếu export default');message.success('Tải module thành công. Cần kiểm tra thêm nghiệp vụ trên route.');}catch(e){message.error(`Không tải được module: ${e.message}`);}finally{setChecking(null);}};
 const resetConfig=()=>{if(!admin||saving)return;Modal.confirm({title:'Xoá toàn bộ cấu hình route?',content:'Xoá các remote và mapping của doanh nghiệp này. Các màn hình sẽ dùng giao diện ERP mặc định.',okText:'Xoá cấu hình',okButtonProps:{danger:true},cancelText:'Huỷ',onOk:async()=>{setSaving(true);try{await saveConfig(user.bizId,{...config,remotes:[],routes:[]});setEditor(null);await refresh();message.success('Đã xoá cấu hình route');}catch(e){message.error(e.message);throw e;}finally{setSaving(false);}}});};
 return <Space direction="vertical" size={16} style={{width:'100%'}}>
  {!admin&&<Alert type="warning" message="Chỉ quản trị viên hoặc chủ doanh nghiệp được sửa cấu hình."/>}
  <Space wrap><Tag>Doanh nghiệp #{user.bizId}</Tag><Tag>Revision {draft.revision}</Tag><Button onClick={refresh}>Tải lại</Button>{admin&&<><Button danger disabled={saving || (!config.remotes.length && !config.routes.length && !draft.remotes.length && !draft.routes.length)} onClick={resetConfig}>Xoá cấu hình</Button><Button type="primary" loading={saving} onClick={persist}>Lưu cấu hình</Button></>}</Space>
  <Card title="Remote" extra={admin&&<Button onClick={()=>edit('remote')}>Thêm remote</Button>}><Table rowKey="id" pagination={false} scroll={{x:700}} dataSource={draft.remotes} columns={[
   {title:'Mã remote',dataIndex:'id'},{title:'Remote entry',dataIndex:'remoteEntry'},{title:'Scope',dataIndex:'scope'},{title:'Version',dataIndex:'version'},{title:'Thao tác',render:(_,row)=>admin&&<Space><Button onClick={()=>edit('remote',row)}>Sửa</Button><Button danger disabled={draft.routes.some(r=>r.remoteId===row.id)} onClick={()=>change({remotes:draft.remotes.filter(r=>r.id!==row.id)})}>Xoá</Button></Space>}
  ]}/></Card>
  <Card title="Mapping route" extra={admin&&<Button disabled={!draft.remotes.length} onClick={()=>edit('route')}>Thêm route</Button>}><Table rowKey="route" scroll={{x:750}} dataSource={draft.routes} columns={[
   {title:'Route ERP',dataIndex:'route'},{title:'Remote',dataIndex:'remoteId'},{title:'Module',dataIndex:'module'},{title:'Bật',render:(_,row)=><Switch disabled={!admin} checked={row.enabled} onChange={enabled=>change({routes:draft.routes.map(r=>r.route===row.route?{...r,enabled}:r)})}/>},{title:'Thao tác',render:(_,row)=><Space wrap>{admin&&<><Button onClick={()=>edit('route',row)}>Sửa</Button><Button danger onClick={()=>change({routes:draft.routes.filter(r=>r.route!==row.route)})}>Xoá</Button><Button loading={checking===row.route} onClick={()=>check(row)}>Kiểm tra module</Button></>}</Space>}
  ]}/></Card>
  <Modal title={editor?.type==='remote'?'Cấu hình remote':'Cấu hình route'} open={Boolean(editor)} onCancel={()=>setEditor(null)} onOk={()=>form.submit()} okText="Áp dụng vào bản nháp" cancelText="Huỷ"><Form form={form} layout="vertical" onFinish={submit}>
   {editor?.type==='remote'?<><Form.Item name="id" label="Mã remote" rules={[{required:true}]}><Input disabled={Boolean(editor.original)}/></Form.Item><Form.Item name="remoteEntry" label="URL remoteEntry.js" rules={[{required:true}]}><Input placeholder="https://.../remoteEntry.js"/></Form.Item><Form.Item name="scope" label="Scope" rules={[{required:true}]}><Input placeholder="hatenko"/></Form.Item><Form.Item name="version" label="Version / cache key"><Input/></Form.Item></>:<><Form.Item name="route" label="Route ERP" rules={[{required:true}]}><Select options={ROUTES.map(r=>({value:r.route,label:`${r.label} · ${r.route}`}))} onChange={route=>form.setFieldValue('module',ROUTES.find(r=>r.route===route)?.module)}/></Form.Item><Form.Item name="remoteId" label="Remote" rules={[{required:true}]}><Select options={draft.remotes.map(r=>({value:r.id,label:r.id}))}/></Form.Item><Form.Item name="module" label="Module expose" rules={[{required:true}]}><Input placeholder="ProductionOrders"/></Form.Item><Form.Item name="enabled" label="Áp dụng" valuePropName="checked"><Switch/></Form.Item></>}
  </Form></Modal>
 </Space>;
}
