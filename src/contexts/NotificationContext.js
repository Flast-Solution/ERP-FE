import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import useNotificationStream from '@/hooks/useNotificationStream'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ userId, children }) => {
  const streamNotifications = useNotificationStream(userId)
  const [readIds, setReadIds] = useState(() => new Set())
  const notifiedIdsRef = useRef(new Set())

  const notifications = useMemo(() => streamNotifications.map(item => ({
    ...item,
    read: item.read || readIds.has(item.id),
  })), [readIds, streamNotifications])

  const markRead = useCallback((notification) => {
    if (!notification?.id) return
    setReadIds(current => new Set(current).add(notification.id))
  }, [])

  const markAllRead = useCallback((items = streamNotifications) => {
    setReadIds(current => {
      const next = new Set(current)
      items.forEach(item => {
        if (item?.id) next.add(item.id)
      })
      return next
    })
  }, [streamNotifications])

  const requestBrowserNotificationPermission = useCallback(async () => {
    if (!('Notification' in window) || window.Notification.permission !== 'default') return
    await window.Notification.requestPermission()
  }, [])

  useEffect(() => {
    streamNotifications.forEach(item => {
      if (notifiedIdsRef.current.has(item.id)) return
      notifiedIdsRef.current.add(item.id)

      if (
        document.visibilityState !== 'hidden'
        || !('Notification' in window)
        || window.Notification.permission !== 'granted'
      ) return

      const browserNotification = new window.Notification(item.title, {
        body: item.description,
        icon: '/favicon.ico',
        tag: String(item.id),
      })

      browserNotification.onclick = () => {
        window.focus()
        browserNotification.close()
      }
    })
  }, [streamNotifications])

  const unreadCount = notifications.filter(item => !item.read).length

  useEffect(() => {
    const updateDocumentTitle = () => {
      const titleWithoutBadge = document.title.replace(/^\(\d+\)\s*/, '')
      document.title = document.visibilityState === 'hidden' && unreadCount > 0
        ? `(${unreadCount}) ${titleWithoutBadge}`
        : titleWithoutBadge
    }

    updateDocumentTitle()
    document.addEventListener('visibilitychange', updateDocumentTitle)
    return () => document.removeEventListener('visibilitychange', updateDocumentTitle)
  }, [unreadCount])

  const value = useMemo(() => ({
    notifications,
    markRead,
    markAllRead,
    requestBrowserNotificationPermission,
  }), [markAllRead, markRead, notifications, requestBrowserNotificationPermission])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    return {
      notifications: [],
      markRead: () => {},
      markAllRead: () => {},
      requestBrowserNotificationPermission: () => {},
    }
  }
  return context
}
