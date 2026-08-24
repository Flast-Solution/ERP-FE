import { STATUS_LEAD } from '@/configs/constant'

export const DEFAULT_LEAD_STATUS_OPTIONS = [
  { id: STATUS_LEAD.CREATE_DATA, name: 'Tạo mới' },
  { id: STATUS_LEAD.THANH_CO_HOI, name: 'Thành cơ hội', color: 'green' },
]

export const getLeadStatusOption = (status, apiStatuses = []) => (
  DEFAULT_LEAD_STATUS_OPTIONS.find(item => String(item.id) === String(status))
  ?? apiStatuses.find(item => String(item.id) === String(status))
  ?? null
)

export const mergeLeadStatusOptions = (apiStatuses = []) => {
  const statusById = new Map()
  ;[...DEFAULT_LEAD_STATUS_OPTIONS, ...apiStatuses].forEach((status) => {
    if (
      status?.id !== undefined
      && status?.id !== null
      && !statusById.has(String(status.id))
    ) {
      statusById.set(String(status.id), status)
    }
  })

  return Array.from(statusById.values()).map(status => ({
    ...status,
    // Filter được khôi phục từ URL dưới dạng chuỗi.
    id: String(status.id),
  }))
}
