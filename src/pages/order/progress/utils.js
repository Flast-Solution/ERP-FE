export const resolveApiPayload = (response) => response?.data ?? response

export const resolveWorkflowInstances = (response) => {
  const payload = resolveApiPayload(response)
  const candidates = [
    payload?.data,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]
  return candidates.find(Array.isArray) ?? []
}

export const resolveWorkflowPreview = (response) => {
  const payload = resolveApiPayload(response)
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

export const resolveWorkflowProcessDetail = (response) => {
  const payload = resolveApiPayload(response)
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (payload?.process && typeof payload.process === 'object' && !Array.isArray(payload.process)) {
    return payload.process
  }
  return payload
}

export const resolveOrderLots = (response) => {
  const payload = resolveApiPayload(response)
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload,
  ]

  const arrayData = candidates.find(Array.isArray)
  if (arrayData) return arrayData

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData?.id || objectData?.code || objectData?.entityId) {
    return [objectData]
  }

  return []
}

export const getFirstArray = (...items) => items.find(Array.isArray) ?? []

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
    .join('__')
)
