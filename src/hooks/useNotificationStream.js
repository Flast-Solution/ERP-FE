import { useEffect, useState } from 'react'
import axios from 'axios'
import { handleUnauthorized } from '@/utils/sessionExpiry'

const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000
const MAX_NOTIFICATIONS = 100

const parseJson = (value) => {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch (_) {
    return null
  }
}

const parseStreamLine = (line) => {
  const normalizedLine = line.trim()
  if (!normalizedLine || normalizedLine.startsWith(':')) return null
  if (normalizedLine.startsWith('event:') || normalizedLine.startsWith('id:')) return null

  const rawData = normalizedLine.startsWith('data:')
    ? normalizedLine.slice(5).trimStart()
    : normalizedLine

  return parseJson(rawData)
}

const normalizeNotification = (event) => {
  if (!event || typeof event !== 'object') return null
  if (String(event.type ?? '').toUpperCase() === 'HEARTBEAT') return null

  const parsedData = parseJson(event.data)
  const sourceType = String(event.type ?? '').toLowerCase()
  const displayType = ['approve', 'done', 'alert', 'info'].includes(sourceType)
    ? sourceType
    : 'info'
  const createdAt = event.timestamp ?? Date.now()
  const title = event.title ?? 'Thông báo mới'

  return {
    id: event.id ?? `${createdAt}-${title}`,
    type: displayType,
    title,
    description: event.content ?? '',
    createdAt,
    read: Boolean(event.read),
    data: parsedData,
  }
}

const buildStreamUrl = (userId) => {
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '')
  return `${baseUrl}/notification/action/stream/${encodeURIComponent(userId)}`
}

const useNotificationStream = (userId) => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (userId === undefined || userId === null || userId === '') return undefined

    let stopped = false
    let controller = null
    let reconnectTimer = null
    let reconnectDelay = INITIAL_RECONNECT_DELAY

    const addNotification = (event) => {
      const notification = normalizeNotification(event)
      if (!notification) return

      setNotifications(current => {
        if (current.some(item => String(item.id) === String(notification.id))) return current
        return [notification, ...current].slice(0, MAX_NOTIFICATIONS)
      })
    }

    const scheduleReconnect = () => {
      if (stopped) return
      reconnectTimer = window.setTimeout(connect, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
    }

    const connect = async () => {
      controller = new AbortController()
      const token = window.localStorage.getItem('jwt_access_token')

      try {
        const response = await fetch(buildStreamUrl(userId), {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (response.status === 401) {
          stopped = true
          handleUnauthorized()
          return
        }

        if (!response.ok || !response.body) {
          throw new Error(`Notification stream failed with status ${response.status}`)
        }

        reconnectDelay = INITIAL_RECONNECT_DELAY
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!stopped) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split(/\r?\n/)
          buffer = lines.pop() ?? ''
          lines.forEach(line => {
            const event = parseStreamLine(line)
            if (event) addNotification(event)
          })
        }

        if (buffer.trim()) {
          const event = parseStreamLine(buffer)
          if (event) addNotification(event)
        }
        scheduleReconnect()
      } catch (error) {
        if (error?.name !== 'AbortError') scheduleReconnect()
      }
    }

    connect()

    return () => {
      stopped = true
      controller?.abort()
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
    }
  }, [userId])

  return notifications
}

export default useNotificationStream
