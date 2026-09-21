/**
 * Chuẩn hoá response workflow/lot theo contract API thực tế.
 * RequestUtils.Get/Post trả về body: { errorCode, message, success, data }.
 */

/** GET /workflow/process/filter → data.embedded = Process[] */
export const resolveWorkflowList = (response) => {
  const embedded = response?.data?.embedded
  return Array.isArray(embedded) ? embedded : []
}

/** POST /workflow/process/instance/get-entity → data = Instance[] */
export const resolveWorkflowInstances = (response) => {
  return Array.isArray(response?.data) ? response.data : []
}

/**
 * GET /workflow/process/find-id/{id}
 * data = { process, steps, transitions }
 * Consumer gắn process lên instance → trả về data.process (có id).
 */
export const resolveWorkflowProcessDetail = (response) => {
  const process = response?.data?.process
  if (!process || typeof process !== 'object' || Array.isArray(process)) {
    return null
  }
  return process
}

/** GET /workflow/process/preview?instanceId= → data = Preview object */
export const resolveWorkflowPreview = (response) => {
  const preview = response?.data
  if (!preview || typeof preview !== 'object' || Array.isArray(preview)) {
    return null
  }
  return preview
}

/** GET /erp/warehouse-paracel/find-entity → data = Lot[] */
export const resolveOrderLots = (response) => {
  return Array.isArray(response?.data) ? response.data : []
}
