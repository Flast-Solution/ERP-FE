import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {TenantRouteProvider,useTenantRoutes} from './Provider';
import useGetMe from '@/hooks/useGetMe';
import {fetchConfig} from './service';
jest.mock('@/hooks/useGetMe',()=>({__esModule:true,default:jest.fn()}));
jest.mock('./service',()=>({fetchConfig:jest.fn()}));
let observed;function Probe(){observed=useTenantRoutes();return <span>{observed.config?.bizId||observed.status}</span>;}
test('discard previous business responses after switching during pending fetch',async()=>{global.IS_REACT_ACT_ENVIRONMENT=true;let first,second;fetchConfig.mockImplementationOnce(()=>new Promise(r=>first=r)).mockImplementationOnce(()=>new Promise(r=>second=r));useGetMe.mockReturnValue({user:{id:1,bizId:5}});const root=createRoot(document.createElement('div'));try{await act(async()=>root.render(<TenantRouteProvider><Probe/></TenantRouteProvider>));useGetMe.mockReturnValue({user:{id:1,bizId:6}});await act(async()=>root.render(<TenantRouteProvider><Probe/></TenantRouteProvider>));await act(async()=>second({bizId:6,routes:[],remotes:[]}));expect(observed.config.bizId).toBe(6);await act(async()=>first({bizId:5,routes:[],remotes:[]}));expect(observed.config.bizId).toBe(6);}finally{await act(async()=>root.unmount());delete global.IS_REACT_ACT_ENVIRONMENT;}});
