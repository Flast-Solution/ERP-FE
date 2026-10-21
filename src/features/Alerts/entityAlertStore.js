import { create } from 'zustand';

export const notificationUserKey = (user) =>
  `${user?.bizId ?? 'guest'}:${user?.id ?? user?.userId ?? 'guest'}`;

// Share the header's loaded alerts with row actions without fetching per row.
export const useEntityAlertStore = create(() => ({ key: null, alerts: [] }));
