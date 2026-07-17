import { useEffect, useState } from 'react';
import { message } from 'antd';
import { RequestUtils } from '@flast-erp/core/utils';
import { INVENTORY_FETCH_API } from '../constants';
import { buildInventoryQueries, mergeInventoriesByMaterialId } from '../utils';

export const useInventories = (bomRows = []) => {
  const [inventoriesByMaterialId, setInventoriesByMaterialId] = useState(new Map());
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const inventoryQueries = buildInventoryQueries(bomRows);

    if (inventoryQueries.length === 0) {
      setInventoriesByMaterialId(new Map());
      setInventoryLoading(false);
      return undefined;
    }

    setInventoryLoading(true);
    Promise.all(inventoryQueries.map(async ({ materialId, warehouseId }) => {
      const endpoint = `${INVENTORY_FETCH_API}?warehouseId=${encodeURIComponent(warehouseId)}&materialId=${encodeURIComponent(materialId)}`;
      const response = await RequestUtils.Get(endpoint, {});
      const inventories = Array.isArray(response?.data) ? response.data : [];
      return { materialId: String(materialId), inventories };
    }))
      .then((results) => {
        if (!mounted) return;
        setInventoriesByMaterialId(mergeInventoriesByMaterialId(results));
      })
      .catch((error) => {
        if (!mounted) return;
        setInventoriesByMaterialId(new Map());
        message.error(error?.message || 'Không tải được tồn kho vật tư.');
      })
      .finally(() => {
        if (mounted) setInventoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [bomRows]);

  return {
    inventoriesByMaterialId,
    inventoryLoading,
  };
};
