import { createSipSessionStore, installSipSessionBridge } from './authSipSession';
const mockFn = jest.fn;
const user = {id:2,sipExt:'acme_1002'}
const login = () => ({user,sipToken:{token:'sip-only-test',expires:Date.now()/1000+3600},jwtToken:'app-only-test'})

it('captures sibling sipToken on login and session restore without persisting it',()=>{
 const store=createSipSessionStore(),service={setSession:mockFn()}
 installSipSessionBridge(service,store);installSipSessionBridge(service,store)
 const data=login();service.setSession(data)
 expect(service.setSession).toBeDefined()
 expect(store.getState().getToken(user.sipExt).token).toBe('sip-only-test')
 expect(store.getState().credential.token).not.toBe(data.jwtToken)
 expect(store.persist).toBeUndefined()
 service.setSession({...data,sipToken:{...data.sipToken,token:'restored-sip'}})
 expect(store.getState().getToken(user.sipExt).token).toBe('restored-sip')
})
it('clears credentials on logout, missing token and a new account without sipExt',()=>{
 const store=createSipSessionStore(),service={setSession:mockFn()};installSipSessionBridge(service,store)
 for(const next of [null,{user},{user:{id:3}}]){
  service.setSession(login());service.setSession(next)
  expect(store.getState().credential).toBeNull()
  expect(()=>store.getState().getToken(user.sipExt)).toThrow('đăng nhập lại')
 }
})
it('rejects expired credentials, wrong extensions and credentials rejected by RTC',()=>{
 const store=createSipSessionStore();store.getState().setFromAuth(login())
 expect(()=>store.getState().getToken('other')).toThrow('đăng nhập lại')
 store.getState().invalidate('sip-only-test')
 expect(()=>store.getState().getToken(user.sipExt)).toThrow('bị từ chối')
 store.getState().setFromAuth({...login(),sipToken:{token:'expired',expires:Date.now()/1000-1}})
 expect(()=>store.getState().getToken(user.sipExt)).toThrow('hết hạn')
})
it('an old RTC rejection cannot invalidate a newer login credential',()=>{
 const store=createSipSessionStore();store.getState().setFromAuth(login())
 store.getState().setFromAuth({...login(),sipToken:{...login().sipToken,token:'new-login'}})
 store.getState().invalidate('sip-only-test')
 expect(store.getState().getToken(user.sipExt).token).toBe('new-login')
})
