import { create } from 'zustand'

// Deliberately not persisted: the auth response is the only token source.
export const createSipSessionStore = () => create((set, get) => ({
  ext: null,
  ownerId: null,
  credential: null,
  setFromAuth: data => {
    const user = data?.user
    const ext = String(user?.sipExt ?? '').trim()
    const sip = data?.sipToken
    set({
      ext: ext || null,
      ownerId: user?.id ?? user?.userId ?? null,
      credential: ext && typeof sip?.token === 'string' && sip.token && Number(sip.expires) > 0
        ? { token: sip.token, expires: Number(sip.expires), invalid: false }
        : null,
    })
  },
  invalidate: token => {
    const credential = get().credential
    if (credential?.token === token) set({ credential: { ...credential, invalid: true } })
  },
  getToken: ext => {
    const state = get()
    if (state.ext !== String(ext ?? '').trim() || !state.credential) {
      throw Object.assign(new Error('Phiên đăng nhập chưa có token tổng đài. Vui lòng đăng nhập lại.'), { status: 401 })
    }
    if (state.credential.invalid || state.credential.expires <= Date.now() / 1000) {
      throw Object.assign(new Error('Token tổng đài đã hết hạn hoặc bị từ chối. Vui lòng đăng nhập lại.'), { status: 401 })
    }
    return state.credential
  },
}))
export const useSipSession = createSipSessionStore()
const installed = new WeakSet()

// Core emits only data.user, dropping sibling sipToken. Capture the full
// envelope before core handles login/sign-with-token and emits its user event.
export const installSipSessionBridge = (jwtService, store = useSipSession) => {
  if (installed.has(jwtService)) return
  installed.add(jwtService)
  const original = jwtService.setSession
  jwtService.setSession = function (data) {
    store.getState().setFromAuth(data)
    return original.call(this, data)
  }
}
