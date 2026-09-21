export const useNotifications = () => {
  return {
    notifications: [],
    markRead: () => {},
    markAllRead: () => {},
    requestBrowserNotificationPermission: () => {},
  }
}
