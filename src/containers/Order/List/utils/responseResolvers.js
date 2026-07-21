export const resolveWorkflowList = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.embedded,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.content,
    payload?.items,
    payload,
  ]

  return candidates.find(Array.isArray) ?? []
}

export const resolveWorkflowInstances = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.data,
    payload?.data?.embedded,
    payload?.data?.content,
    payload?.data?.items,
    payload?.data?.instances,
    payload?.data?.processInstances,
    payload?.embedded,
    payload?.content,
    payload?.items,
    payload?.instances,
    payload?.processInstances,
    payload,
  ]

  const arrayData = candidates.find(Array.isArray)
  if (arrayData) {
    return arrayData
  }

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData) {
    if (objectData.id || objectData.entityId || objectData.processInstance) {
      return [objectData]
    }

    const values = Object.values(objectData)
    const objectValues = values.filter(item => item && typeof item === 'object')
    if (objectValues.length > 0 && objectValues.length === values.length) {
      return objectValues
    }
  }

  return []
}

export const resolveWorkflowProcessDetail = (response) => {
  const payload = response?.data ?? response
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  if (payload?.process && typeof payload.process === 'object' && !Array.isArray(payload.process)) {
    return payload.process
  }
  return payload
}

export const resolveWorkflowPreview = (response) => {
  const payload = response?.data ?? response
  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data
  }
  return payload
}

export const resolveOrderLots = (response) => {
  const payload = response?.data ?? response
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
  if (arrayData) {
    return arrayData
  }

  const objectData = candidates.find(item => item && typeof item === 'object')
  if (objectData?.id || objectData?.code || objectData?.entityId) {
    return [objectData]
  }

  return []
}
