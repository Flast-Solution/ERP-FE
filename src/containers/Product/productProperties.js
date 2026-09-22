const hasId = (id) => id !== undefined && id !== null && id !== ''

export const mergeInitialProductProperties = (properties = [], attributes = []) => {
  const currentProperties = Array.isArray(properties) ? properties : []
  const currentAttributeIds = new Set(
    currentProperties.map(item => item?.attributedId).filter(hasId).map(String),
  )

  const initialProperties = (Array.isArray(attributes) ? attributes : [])
    .filter(attribute => (
      attribute?.initial === true
      && hasId(attribute?.id)
      && !currentAttributeIds.has(String(attribute.id))
    ))
    .map(attribute => {
      currentAttributeIds.add(String(attribute.id))
      return {
        attributedId: attribute.id,
        attributedValueId: [],
      }
    })

  return [...currentProperties, ...initialProperties]
}

export const syncSelectedProductProperties = (properties = [], selectedAttributeIds = []) => {
  const currentProperties = Array.isArray(properties) ? properties : []
  const currentByAttributeId = new Map(
    currentProperties
      .filter(item => hasId(item?.attributedId))
      .map(item => [String(item.attributedId), item]),
  )

  return [...new Set(
    (Array.isArray(selectedAttributeIds) ? selectedAttributeIds : [])
      .filter(hasId)
      .map(String),
  )].map(attributeId => (
    currentByAttributeId.get(attributeId) ?? {
      attributedId: Number(attributeId),
      attributedValueId: [],
    }
  ))
}
