import React,{Suspense} from 'react';
import {Loading} from '@flast-erp/core/components';
import {Result,Button} from 'antd';
import {useLocation} from 'react-router-dom';
import RemotePage from '@/components/RemotePage';
import {useTenantRoutes} from '@/features/TenantRoutes/Provider';
import {resolveRoute} from '@/features/TenantRoutes/model';
export default function TenantPage({page,local:LocalPage,...props}) {
 const {pathname}=useLocation();const {status,config,error,refresh}=useTenantRoutes();
 if(status==='loading')return <Loading/>;
 if(status==='error')return <Result status="warning" title="Không tải được cấu hình màn hình" subTitle={error} extra={<Button onClick={refresh}>Thử lại</Button>}/>;
 const remote=resolveRoute(config,pathname,page);
 return remote?<RemotePage key={`${remote.id}:${remote.remoteEntry}:${remote.version}:${remote.module}`} remoteEntry={remote.remoteEntry} scope={remote.scope} module={remote.module} version={remote.version} {...props}/>:<Suspense fallback={<Loading/>}><LocalPage {...props}/></Suspense>;
}
