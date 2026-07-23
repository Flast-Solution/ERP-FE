import axios from 'axios'
import { InAppEvent } from '@flast-erp/core/utils'
import { ACTIONS, CHANGE_STORE } from '@/configs'

export const AUTH_REDIRECT_URL_KEY = 'auth_redirect_url'

let unauthorizedHandled = false

const getCurrentUrl = () => (
  `${window.location.pathname}${window.location.search}${window.location.hash}`
)

export const handleUnauthorized = () => {
  if (unauthorizedHandled) return
  unauthorizedHandled = true

  const currentUrl = getCurrentUrl()
  if (window.location.pathname !== '/login') {
    window.sessionStorage.setItem(AUTH_REDIRECT_URL_KEY, currentUrl)
  }

  window.localStorage.removeItem('jwt_access_token')
  delete axios.defaults.headers.common.Authorization
  InAppEvent.emit(CHANGE_STORE, { type: ACTIONS.REMOVE_USER })

  window.location.replace('/login')
}

export const hasAccessToken = () => Boolean(
  window.localStorage.getItem('jwt_access_token')
)
