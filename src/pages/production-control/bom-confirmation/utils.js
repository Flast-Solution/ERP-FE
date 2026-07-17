export const getProductId = (product = {}) => (
  product.productId ?? product.product?.id ?? product.id
);

export const getResponseItems = (response) => {
  const payload = response?.data ?? response;
  const candidates = [
    payload?.data,
    payload?.items,
    payload?.content,
    payload?.embedded,
    payload,
  ];
  return candidates.find(Array.isArray) ?? [];
};

export const getInventoryQuantity = (material = {}) => (
  (material.inventory ?? []).reduce((total, inventory) => (
    total + Number(inventory?.quantity ?? 0)
  ), 0)
);

export const getBomStatusLabel = (status) => (
  Number(status) === 1 ? 'Sử dụng' : 'Không sử dụng'
);

export const getMaterialSpecification = (row = {}) => (
  row.materialUnit === 'DIMENSION'
    ? `${Number(row.width ?? 0)} × ${Number(row.height ?? 0)} cm`
    : '-'
);

export const mapBomMaterialRows = (bom = {}) => (
  (bom.productMaterials ?? []).map((item, index) => {
    const requiredQuantity = Number(item.quantity ?? 0) * Number(bom.productionQuantity ?? 1);
    const stockQuantity = getInventoryQuantity(item.material);
    return {
      ...item,
      id: `${bom.bomProductId ?? bom.productId}-${item.productMaterialId ?? index}`,
      productName: bom.productName,
      name: item.material?.name ?? `Vật tư #${item.materialId}`,
      requiredQuantity,
      stockQuantity,
      status: stockQuantity >= requiredQuantity ? 'Đủ tồn kho' : 'Thiếu tồn kho',
    };
  })
);

export const mergeBomMaterialRows = (rows = []) => {
  const rowsBySpecification = new Map();
  rows.forEach((row) => {
    const key = [
      row.materialId,
      row.materialUnit ?? '',
      Number(row.width ?? 0),
      Number(row.height ?? 0),
    ].join(':');
    const existing = rowsBySpecification.get(key);
    if (!existing) {
      rowsBySpecification.set(key, {
        ...row,
        id: `material-specification-${key}`,
        specification: getMaterialSpecification(row),
        productNames: [row.productName],
        productMaterialIds: [row.productMaterialId],
      });
      return;
    }

    existing.requiredQuantity += Number(row.requiredQuantity ?? 0);
    existing.productNames.push(row.productName);
    existing.productMaterialIds.push(row.productMaterialId);
    existing.productName = Array.from(new Set(existing.productNames.filter(Boolean))).join(', ');
    existing.status = existing.stockQuantity >= existing.requiredQuantity ? 'Đủ tồn kho' : 'Thiếu tồn kho';
  });
  return Array.from(rowsBySpecification.values());
};

export const buildBomItems = (productionOrder = {}) => (
  (productionOrder.orderDetails ?? []).map((product, index) => {
    const productId = getProductId(product);
    if (productId == null || productId === '') return null;
    const orderDetailId = product.id ?? index;
    const orderLabel = [
      product.key ?? product.code ?? `#${product.id ?? index + 1}`,
      product.productName ?? product.product?.name ?? product.name,
    ].filter(Boolean).join(' · ');
    return {
      key: String(orderDetailId),
      productId,
      name: product.productName ?? product.product?.name ?? product.name ?? `Sản phẩm ${index + 1}`,
      orderLabel,
      productionQuantity: Number(
        productionOrder.productDetails?.[String(orderDetailId)]?.target
        ?? product.target
        ?? 0,
      ),
    };
  }).filter(Boolean)
);

export const buildProducts = (bomItems = []) => Array.from(
  new Map(bomItems.map(item => [String(item.productId), {
    id: item.productId,
    name: item.name,
  }])).values(),
);

export const buildBomMaterialGroups = (bomItems = [], selectedBomsByProductId = {}) => (
  bomItems.map((item, index) => {
    const bom = selectedBomsByProductId[item.key];
    return {
      key: item.key,
      title: `BOM ${index + 1}`,
      orderLabel: item.orderLabel,
      version: bom?.version,
      rows: bom ? mapBomMaterialRows({
        ...bom,
        productName: item.orderLabel,
        productionQuantity: item.productionQuantity,
      }).map(row => ({
        ...row,
        specification: getMaterialSpecification(row),
      })) : [],
    };
  })
);

export const resolveDefaultBom = (productBoms = [], savedBomProductId) => (
  productBoms.find(bom => String(bom.bomProductId) === String(savedBomProductId))
  ?? productBoms.find(bom => Number(bom.status) === 1)
  ?? productBoms[0]
);

export const buildBomSelectionValues = (bomItems = [], defaultBoms = {}) => (
  Object.fromEntries(bomItems.map((item) => {
    const defaultBom = defaultBoms[item.key];
    return [item.key, {
      orderLabel: item.orderLabel,
      version: defaultBom?.version,
      status: defaultBom ? getBomStatusLabel(defaultBom.status) : undefined,
      bomProductId: defaultBom?.bomProductId ?? null,
    }];
  }))
);

export const buildInventoryQueries = (bomRows = []) => {
  const inventoryQueryMap = new Map();
  bomRows.forEach((row) => {
    if (row.materialId == null) return;

    const warehouseIds = Array.from(new Set(
      (row.material?.inventory ?? [])
        .map(inventory => inventory?.warehouseId)
        .filter(warehouseId => warehouseId != null),
    ));
    const queryWarehouseIds = warehouseIds.length > 0 ? warehouseIds : [''];
    queryWarehouseIds.forEach((warehouseId) => {
      inventoryQueryMap.set(`${row.materialId}:${warehouseId}`, {
        materialId: row.materialId,
        warehouseId,
      });
    });
  });
  return Array.from(inventoryQueryMap.values());
};

export const mergeInventoriesByMaterialId = (results = []) => {
  const nextInventoriesByMaterialId = new Map();
  results.forEach(({ materialId, inventories }) => {
    const inventoriesById = nextInventoriesByMaterialId.get(materialId) ?? new Map();
    inventories.forEach(inventory => inventoriesById.set(String(inventory.id), inventory));
    nextInventoriesByMaterialId.set(materialId, inventoriesById);
  });
  return new Map(
    Array.from(nextInventoriesByMaterialId.entries())
      .map(([materialId, inventoriesById]) => [materialId, Array.from(inventoriesById.values())]),
  );
};

export const restoreOutboundsToAllocations = ({
  outbounds = [],
  bomRows = [],
  inventoriesByMaterialId = new Map(),
}) => (
  outbounds.map((outbound, index) => {
    const bomRow = bomRows.find(row => String(row.materialId) === String(outbound.materialId));
    const inventory = (inventoriesByMaterialId.get(String(outbound.materialId)) ?? []).find(item => (
      String(item.warehouseId) === String(outbound.warehouseId)
      && Number(item.width ?? 0) === Number(outbound.width ?? 0)
      && Number(item.height ?? 0) === Number(outbound.height ?? 0)
    ));

    return {
      id: `outbound-${outbound.id ?? index}`,
      outboundId: outbound.id,
      productMaterialId: bomRow?.productMaterialId ?? null,
      materialId: outbound.materialId,
      materialName: bomRow?.name ?? `Vật tư #${outbound.materialId}`,
      inventoryId: inventory?.id ?? null,
      warehouseId: outbound.warehouseId,
      availableQuantity: Number(inventory?.quantity ?? outbound.quantity ?? 0),
      width: Number(outbound.width ?? inventory?.width ?? 0),
      height: Number(outbound.height ?? inventory?.height ?? 0),
      quantity: Number(outbound.quantity ?? 0),
    };
  })
);

export const validateAllocationQuantity = ({
  bomRow,
  inventory,
  quantity,
  allocations = [],
}) => {
  const allocatedForMaterial = allocations
    .filter(item => item.productMaterialId === bomRow.productMaterialId)
    .reduce((total, item) => total + item.quantity, 0);
  const remainingRequiredQuantity = Number(bomRow.requiredQuantity) - allocatedForMaterial;
  if (quantity > remainingRequiredQuantity) {
    return `Vật tư ${bomRow.name} chỉ còn cần phân bổ ${remainingRequiredQuantity}.`;
  }

  const allocatedFromInventory = allocations
    .filter(item => item.inventoryId === inventory.id)
    .reduce((total, item) => total + item.quantity, 0);
  const remainingInventoryQuantity = Number(inventory.quantity ?? 0) - allocatedFromInventory;
  if (quantity > remainingInventoryQuantity) {
    return `Kho #${inventory.warehouseId} chỉ còn ${remainingInventoryQuantity}.`;
  }

  return null;
};

export const buildAllocationEntry = ({
  bomRow,
  inventory,
  quantity,
  sequence,
}) => ({
  id: `${bomRow.productMaterialId}-${inventory.id}-${sequence}`,
  productMaterialId: bomRow.productMaterialId,
  materialId: bomRow.materialId,
  materialName: bomRow.name,
  inventoryId: inventory.id,
  warehouseId: inventory.warehouseId,
  availableQuantity: Number(inventory.quantity ?? 0),
  width: Number(inventory.width ?? 0),
  height: Number(inventory.height ?? 0),
  quantity,
});

export const validateSubmitAllocations = (bomRows = [], allocations = []) => {
  const invalidBomRow = bomRows.find((bomRow) => {
    const allocatedQuantity = allocations
      .filter(item => item.productMaterialId === bomRow.productMaterialId)
      .reduce((total, item) => total + item.quantity, 0);
    return Math.abs(allocatedQuantity - Number(bomRow.requiredQuantity)) > 0.000001;
  });
  if (invalidBomRow) {
    return `Vật tư ${invalidBomRow.name} phải phân bổ đủ ${invalidBomRow.requiredQuantity}.`;
  }

  const exceededInventory = allocations.find((allocation) => {
    if (allocation.inventoryId == null) return false;
    const allocatedQuantity = allocations
      .filter(item => item.inventoryId === allocation.inventoryId)
      .reduce((total, item) => total + item.quantity, 0);
    return allocatedQuantity > allocation.availableQuantity;
  });
  if (exceededInventory) {
    return `Số lượng xuất tại kho #${exceededInventory.warehouseId} vượt quá tồn kho.`;
  }

  return null;
};

export const buildMaterialConfirmationPayload = (values = {}, allocations = []) => ({
  ...values,
  allocations: allocations.map(allocation => ({
    inventoryId: allocation.inventoryId,
    warehouseId: allocation.warehouseId,
    materialId: allocation.materialId,
    productMaterialId: allocation.productMaterialId,
    quantity: allocation.quantity,
    width: allocation.width,
    height: allocation.height,
  })),
});

export const mergeUsers = (currentUsers, nextUsers) => {
  const usersById = new Map(currentUsers.map(user => [String(user.id), user]));
  nextUsers.forEach(user => usersById.set(String(user.id), user));
  return Array.from(usersById.values());
};
