export const mergeInitialProductProperties = (properties = [], attributes = []) => {
  const currentProperties = Array.isArray(properties) ? properties : [];
  const currentAttributeIds = new Set(
    currentProperties
      .map(item => item?.attributedId)
      .filter(id => id !== undefined && id !== null && id !== '')
      .map(String),
  );

  const initialProperties = (Array.isArray(attributes) ? attributes : [])
    .reduce((result, attribute) => {
      if (
        attribute?.initial !== true
        || attribute?.id === undefined
        || attribute?.id === null
        || attribute?.id === ''
        || currentAttributeIds.has(String(attribute.id))
      ) {
        return result;
      }

      currentAttributeIds.add(String(attribute.id));
      result.push({
        attributedId: attribute.id,
        attributedValueId: [],
      });
      return result;
    }, []);

  return [...currentProperties, ...initialProperties];
};

export const syncSelectedProductProperties = (properties = [], selectedAttributeIds = []) => {
  const currentProperties = Array.isArray(properties) ? properties : [];
  const currentByAttributeId = new Map(
    currentProperties
      .filter(item => item?.attributedId !== undefined && item?.attributedId !== null)
      .map(item => [String(item.attributedId), item]),
  );

  return Array.from(new Set(
    (Array.isArray(selectedAttributeIds) ? selectedAttributeIds : [])
      .filter(id => id !== undefined && id !== null && id !== '')
      .map(String),
  )).map(attributeId => (
    currentByAttributeId.get(attributeId) ?? {
      attributedId: Number.isNaN(Number(attributeId)) ? attributeId : Number(attributeId),
      attributedValueId: [],
    }
  ));
};
