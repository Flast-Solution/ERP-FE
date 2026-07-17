import { useCallback, useEffect, useRef, useState } from 'react';
import { Form } from 'antd';
import { message } from 'antd';
import {
  buildAllocationEntry,
  restoreOutboundsToAllocations,
  validateAllocationQuantity,
} from '../utils';

export const useAllocations = ({
  bomRows = [],
  inventoriesByMaterialId = new Map(),
  mode = 'create',
  outbounds = [],
}) => {
  const [allocationForm] = Form.useForm();
  const [allocations, setAllocations] = useState([]);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const allocationSequenceRef = useRef(0);
  const restoredOutboundsRef = useRef(false);

  const selectedAllocationProductMaterialId = Form.useWatch('productMaterialId', allocationForm);
  const selectedAllocationInventoryId = Form.useWatch('inventoryId', allocationForm);

  const selectedAllocationBomRow = bomRows.find(row => (
    String(row.productMaterialId) === String(selectedAllocationProductMaterialId)
  ));
  const allocationInventoryOptions = selectedAllocationBomRow
    ? inventoriesByMaterialId.get(String(selectedAllocationBomRow.materialId)) ?? []
    : [];
  const selectedAllocationInventory = allocationInventoryOptions.find(inventory => (
    String(inventory.id) === String(selectedAllocationInventoryId)
  ));
  const selectedInventoryAllocatedQuantity = allocations
    .filter(allocation => String(allocation.inventoryId) === String(selectedAllocationInventoryId))
    .reduce((total, allocation) => total + allocation.quantity, 0);
  const selectedInventoryRemainingQuantity = Math.max(
    0,
    Number(selectedAllocationInventory?.quantity ?? 0) - selectedInventoryAllocatedQuantity,
  );

  const resetAllocations = useCallback(() => {
    setAllocations([]);
    setAllocationModalOpen(false);
    allocationForm.resetFields();
  }, [allocationForm]);

  const removeAllocation = useCallback((allocationId) => {
    setAllocations(current => current.filter(item => item.id !== allocationId));
  }, []);

  const openAllocationModal = useCallback(() => {
    allocationForm.resetFields();
    setAllocationModalOpen(true);
  }, [allocationForm]);

  const closeAllocationModal = useCallback(() => {
    setAllocationModalOpen(false);
    allocationForm.resetFields();
  }, [allocationForm]);

  const addAllocation = useCallback(async () => {
    let values;
    try {
      values = await allocationForm.validateFields();
    } catch {
      return;
    }

    const bomRow = bomRows.find(row => String(row.productMaterialId) === String(values.productMaterialId));
    const inventory = inventoriesByMaterialId
      .get(String(bomRow?.materialId))
      ?.find(item => String(item.id) === String(values.inventoryId));

    if (!bomRow || !inventory) {
      message.error('Không tìm thấy vật tư hoặc kho đã chọn.');
      return;
    }

    const quantity = Number(values.quantity);
    const validationError = validateAllocationQuantity({
      bomRow,
      inventory,
      quantity,
      allocations,
    });
    if (validationError) {
      message.error(validationError);
      return;
    }

    setAllocations((current) => {
      const existingAllocation = current.find(item => (
        item.productMaterialId === bomRow.productMaterialId
        && item.warehouseId === inventory.warehouseId
        && item.inventoryId === inventory.id
      ));

      if (existingAllocation) {
        return current.map(item => item.id === existingAllocation.id
          ? { ...item, quantity: item.quantity + quantity }
          : item);
      }

      allocationSequenceRef.current += 1;
      return [...current, buildAllocationEntry({
        bomRow,
        inventory,
        quantity,
        sequence: allocationSequenceRef.current,
      })];
    });
    closeAllocationModal();
  }, [allocationForm, allocations, bomRows, closeAllocationModal, inventoriesByMaterialId]);

  useEffect(() => {
    if (mode !== 'edit' || restoredOutboundsRef.current || bomRows.length === 0) return;

    if (outbounds.length === 0) {
      restoredOutboundsRef.current = true;
      return;
    }

    const inventoryDataReady = outbounds.every(outbound => (
      inventoriesByMaterialId.has(String(outbound.materialId))
    ));
    if (!inventoryDataReady) return;

    setAllocations(restoreOutboundsToAllocations({
      outbounds,
      bomRows,
      inventoriesByMaterialId,
    }));
    restoredOutboundsRef.current = true;
  }, [bomRows, inventoriesByMaterialId, mode, outbounds]);

  return {
    allocationForm,
    allocations,
    allocationModalOpen,
    selectedAllocationBomRow,
    allocationInventoryOptions,
    selectedAllocationInventory,
    selectedInventoryRemainingQuantity,
    resetAllocations,
    removeAllocation,
    openAllocationModal,
    closeAllocationModal,
    addAllocation,
  };
};
