/**
 * Response resolvers dùng chung contract với Order List.
 * GET/POST body: { errorCode, message, success, data }
 */
export {
  resolveWorkflowInstances,
  resolveWorkflowPreview,
  resolveWorkflowProcessDetail,
  resolveOrderLots,
} from '@/containers/Order/List/utils/responseResolvers'

export const getValue = (...items) => items.find(item => item !== undefined && item !== null && item !== '')

export const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
}

export const normalizeRemoteContainerName = (value = '') => value.replace(/[^A-Za-z0-9_$]/g, '_')

export const buildRemoteAlias = (...parts) => normalizeRemoteContainerName(
  parts
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join('__'),
)
