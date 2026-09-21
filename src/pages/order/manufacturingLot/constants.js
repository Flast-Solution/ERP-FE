export const CREATE_WAREHOUSE_PARCEL_API = '/erp/warehouse-paracel/create'
export const PROVIDER_FETCH_API = '/provider/fetch'
export const ORDER_LOTS_FIND_API = '/erp/warehouse-paracel/find-entity'
export const WORKFLOW_FILTER_API = '/workflow/process/filter?limit=50&offset=0'
export const ERROR_WORKFLOW_TYPE = 'QUANLITY'
export const ERROR_WORKFLOW_FILTER_API = `${WORKFLOW_FILTER_API}&flowType=${ERROR_WORKFLOW_TYPE}`

export const DEFAULT_LOT_VALUES = {
  lotType: 'PRODUCTION',
  priority: 'HIGH',
}
