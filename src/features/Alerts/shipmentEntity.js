export const mapShipmentEntity = entity => {
  if (!['SHIPMENT', 'SHIPPING'].includes(entity?.kind)) return null;
  return {
    shipping: entity,
    customer: {
      name: entity.delivery?.recipientName,
      mobile: entity.delivery?.recipientPhone,
      address: entity.delivery?.address,
    },
  };
};
