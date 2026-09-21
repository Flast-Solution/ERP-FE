export const MANUFACTURE_SAVE_API = '/erp/manufacture/save'
export const MANUFACTURE_FETCH_API = '/erp/manufacture/fetch'
export const WAITING_ORDER_FETCH_API = '/erp/order/fetch'
export const USER_LIST_API = '/user/list'
export const MANUFACTURE_STATUS_LIST_API = '/entity-status/list-by-type'
export const MANUFACTURE_STATUS_SAVE_API = '/entity-status/save-application-status'

export const PRODUCTION_PAGE_SIZE = 10
export const WAITING_ORDER_PAGE_SIZE = 10
export const USER_PAGE_SIZE = 100
export const WAITING_ORDER_SEARCH_DEBOUNCE_MS = 300

export const MANUFACTURE_STATUS_MAP = {
  0: 'new',
  1: 'running',
  2: 'completed',
}

export const MANUFACTURE_STATUS_OPTIONS = [
  { value: 0, label: 'Mới tạo' },
  { value: 1, label: 'Đang chạy' },
  { value: 2, label: 'Hoàn thành' },
]

export const MANUFACTURE_SYSTEM_STATUSES = MANUFACTURE_STATUS_OPTIONS.map(option => ({
  id: option.value,
  name: option.label,
  color: null,
  entityType: 'MANUFACTURE',
}))

export const EMPTY_FILTERS = {
  code: '',
  orderCode: '',
  status: undefined,
  dateRange: null,
}
