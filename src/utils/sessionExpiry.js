import axios from 'axios'
import { InAppEvent } from '@flast-erp/core/utils'
import { ACTIONS, CHANGE_STORE } from '@/configs'

export const AUTH_REDIRECT_URL_KEY = 'auth_redirect_url'

let unauthorizedHandled = false
let expiryTimer = null
let scheduledToken = null
let expiryMonitorStarted = false

const MAX_TIMEOUT_MS = 2_147_483_647

const getCurrentUrl = () => (
  `${window.location.pathname}${window.location.search}${window.location.hash}`
)

const decodeTokenPayload = (token = '') => {
  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null

    const base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')

    return JSON.parse(window.atob(base64))
  } catch (_) {
    return null
  }
}

export const getAccessTokenExpiration = (token) => {
  const expiration = Number(decodeTokenPayload(token)?.exp)
  return Number.isFinite(expiration) && expiration > 0
    ? expiration * 1000
    : null
}

export const isAccessTokenExpired = (
  token = window.localStorage.getItem('jwt_access_token')
) => {
  if (!token) return false

  const expiration = getAccessTokenExpiration(token)
  return expiration !== null && Date.now() >= expiration
}


const clearExpiryTimer = () => {
  if (expiryTimer) window.clearTimeout(expiryTimer)
  expiryTimer = null
  scheduledToken = null
}

export const handleUnauthorized = () => {
  if (unauthorizedHandled) return
  unauthorizedHandled = true
  clearExpiryTimer()

  const currentUrl = getCurrentUrl()
  if (window.location.pathname !== '/login') {
    window.sessionStorage.setItem(AUTH_REDIRECT_URL_KEY, currentUrl)
  }

  window.localStorage.removeItem('jwt_access_token')
  delete axios.defaults.headers.common.Authorization
  InAppEvent.emit(CHANGE_STORE, { type: ACTIONS.REMOVE_USER })

  window.location.replace('/login')
}

export const scheduleAccessTokenExpiry = (
  token = window.localStorage.getItem('jwt_access_token')
) => {
  if (!token) {
    clearExpiryTimer()
    return
  }

  const expiration = getAccessTokenExpiration(token)
  if (expiration === null) {
    clearExpiryTimer()
    return
  }
  if (Date.now() >= expiration) {
    clearExpiryTimer()
    handleUnauthorized()
    return
  }
  if (expiryTimer && scheduledToken === token) return

  clearExpiryTimer()
  scheduledToken = token

  const checkExpiration = () => {
    const remaining = expiration - Date.now()
    if (remaining <= 0) {
      handleUnauthorized()
      return
    }
    expiryTimer = window.setTimeout(checkExpiration, Math.min(remaining, MAX_TIMEOUT_MS))
  }

  checkExpiration()
}

export const startAccessTokenExpiryMonitor = () => {
  if (expiryMonitorStarted) return
  expiryMonitorStarted = true

  const checkCurrentToken = (source = 'monitor') => {
    scheduleAccessTokenExpiry()
  }
  const checkVisibleToken = () => {
    if (document.visibilityState === 'visible') checkCurrentToken('visibility')
  }
  const checkStoredToken = (event) => {
    if (event.key === 'jwt_access_token') checkCurrentToken('storage')
  }

  InAppEvent.on(CHANGE_STORE, () => checkCurrentToken('session-change'))
  document.addEventListener('visibilitychange', checkVisibleToken)
  window.addEventListener('focus', () => checkCurrentToken('focus'))
  window.addEventListener('storage', checkStoredToken)
  checkCurrentToken('startup')
}

export const hasAccessToken = () => Boolean(
  window.localStorage.getItem('jwt_access_token')
)
