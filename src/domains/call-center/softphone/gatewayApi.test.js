import { gatewayApi, clearGatewayToken } from './gatewayApi'
import { useSipSession } from './authSipSession'
jest.mock('@/configs',()=>({SUCCESS_CODE:200}))
jest.mock('./deviceId',()=>({getDeviceId:()=> 'device-test'}))
afterEach(()=>{clearGatewayToken();useSipSession.getState().setFromAuth(null);delete global.fetch})
test('connects with auth SIP bearer only, and blocks expired tokens before any request',async()=>{
 const ext='acme_1002'
 useSipSession.getState().setFromAuth({user:{id:2,sipExt:ext},sipToken:{token:'auth-sip',expires:Date.now()/1000+3600}})
 global.fetch=jest.fn().mockResolvedValue({ok:true,status:200,text:async()=>JSON.stringify({errorCode:200,data:{id:'s'}})})
 await gatewayApi.token(ext);await gatewayApi.createSession()
 expect(global.fetch).toHaveBeenCalledWith('https://ws.flast.vn/webrtc/sessions?device=device-test',expect.objectContaining({headers:{Authorization:'Bearer auth-sip'}}))
 useSipSession.getState().setFromAuth({user:{id:2,sipExt:ext},sipToken:{token:'expired',expires:Date.now()/1000-1}})
 await expect(gatewayApi.status('s')).rejects.toThrow('đăng nhập lại')
 expect(global.fetch).toHaveBeenCalledTimes(1)
})
test('revokes an auth credential after RTC 401 rather than requesting register',async()=>{
 useSipSession.getState().setFromAuth({user:{id:2,sipExt:'1002'},sipToken:{token:'auth-sip',expires:Date.now()/1000+3600}})
 global.fetch=jest.fn().mockResolvedValue({ok:false,status:401,text:async()=>JSON.stringify({success:false,message:'expired'})})
 await gatewayApi.token('1002');await expect(gatewayApi.status('s')).rejects.toMatchObject({status:401})
 await expect(gatewayApi.status('s')).rejects.toThrow('đăng nhập lại')
 expect(global.fetch).toHaveBeenCalledTimes(1)
})
