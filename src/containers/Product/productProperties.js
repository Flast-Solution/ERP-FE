const hasId = (id) => id !== undefined && id !== null && id !== ''

export const isDefaultProductAttribute = (attribute, typeId) => hasId(typeId)
  ? (Array.isArray(attribute?.listType) && attribute.listType.some(id => String(id) === String(typeId)))
  : attribute?.initial === true

export const updateAttributeDefaults = (attributes, selectedIds, typeId) => {
  const selected = new Set(selectedIds.map(String))
  return attributes.map(item => {
    if (!hasId(typeId)) return { ...item, initial: selected.has(String(item.id)) }
    const listType = (Array.isArray(item.listType) ? item.listType : []).filter(id => String(id) !== String(typeId))
    if (selected.has(String(item.id))) listType.push(Number(typeId))
    return { ...item, listType }
  })
}

export const mergeInitialProductProperties = (properties = [], attributes = [], typeId) => {
  const currentProperties = Array.isArray(properties) ? properties : []
  const currentAttributeIds = new Set(
    currentProperties.map(item => item?.attributedId).filter(hasId).map(String),
  )

  const initialProperties = (Array.isArray(attributes) ? attributes : [])
    .filter(attribute => {
      if (!isDefaultProductAttribute(attribute, typeId) || !hasId(attribute?.id)
        || currentAttributeIds.has(String(attribute.id))) return false
      currentAttributeIds.add(String(attribute.id))
      return true
    })
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
