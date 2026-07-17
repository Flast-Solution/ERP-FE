import { useEffect, useState } from "react";
import { message } from "antd";
import { RequestUtils } from "@flast-erp/core/utils";
import { INVENTORY_FETCH_API } from "../constants";
import { buildInventoryQueries, mergeInventoriesByMaterialId } from "../utils";

const EMPTY_OUTBOUNDS = [];

export const useInventories = (bomRows = [], outbounds) => {
  const [inventoriesByMaterialId, setInventoriesByMaterialId] = useState(
    new Map(),
  );
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const safeOutbounds = Array.isArray(outbounds) ? outbounds : EMPTY_OUTBOUNDS;

  useEffect(() => {
    let mounted = true;
    const inventoryQueriesByKey = new Map(
      buildInventoryQueries(bomRows).map((query) => [
        `${query.materialId}:${query.warehouseId}`,
        query,
      ]),
    );
    safeOutbounds.forEach((outbound) => {
      if (outbound?.materialId == null || outbound?.warehouseId == null) return;
      const query = {
        materialId: outbound.materialId,
        warehouseId: outbound.warehouseId,
      };
      inventoryQueriesByKey.set(
        `${query.materialId}:${query.warehouseId}`,
        query,
      );
    });
    const inventoryQueries = Array.from(inventoryQueriesByKey.values());

    if (inventoryQueries.length === 0) {
      setInventoriesByMaterialId(new Map());
      setInventoryLoading(false);
      return undefined;
    }

    setInventoryLoading(true);
    Promise.all(
      inventoryQueries.map(async ({ materialId, warehouseId }) => {
        const endpoint = `${INVENTORY_FETCH_API}?warehouseId=${encodeURIComponent(warehouseId)}&materialId=${encodeURIComponent(materialId)}`;
        const response = await RequestUtils.Get(endpoint, {});
        const inventories = Array.isArray(response?.data) ? response.data : [];
        return { materialId: String(materialId), inventories };
      }),
    )
      .then((results) => {
        if (!mounted) return;
        setInventoriesByMaterialId(mergeInventoriesByMaterialId(results));
      })
      .catch((error) => {
        if (!mounted) return;
        setInventoriesByMaterialId(new Map());
        message.error(error?.message || "Không tải được tồn kho vật tư.");
      })
      .finally(() => {
        if (mounted) setInventoryLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [bomRows, safeOutbounds]);

  return {
    inventoriesByMaterialId,
    inventoryLoading,
  };
};
