import React from 'react';
import { Form, InputNumber, Modal, Select } from 'antd';

const AllocationModal = ({
  open = false,
  allocationForm,
  bomRows = [],
  allocations = [],
  inventoryLoading = false,
  selectedAllocationBomRow,
  allocationInventoryOptions = [],
  selectedAllocationInventory,
  selectedInventoryRemainingQuantity = 0,
  onOk,
  onCancel,
}) => (
  <Modal
    title="Thêm vật tư phân bổ"
    open={open}
    width={480}
    okText="Thêm vào danh sách"
    cancelText="Hủy"
    onOk={onOk}
    onCancel={onCancel}
    destroyOnHidden
  >
    <Form form={allocationForm} layout="vertical" preserve={false}>
      <Form.Item
        name="productMaterialId"
        label="Tên vật tư"
        rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Chọn vật tư theo BOM"
          options={bomRows.map(row => ({
            value: row.productMaterialId,
            label: [
              row.name,
              row.specification !== '-' ? row.specification : null,
              `Cần ${row.requiredQuantity}`,
            ].filter(Boolean).join(' · '),
          }))}
          onChange={() => allocationForm.setFieldsValue({ inventoryId: undefined, quantity: undefined })}
        />
      </Form.Item>
      <Form.Item
        name="inventoryId"
        label="Kho"
        rules={[{ required: true, message: 'Vui lòng chọn kho' }]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          loading={inventoryLoading}
          disabled={!selectedAllocationBomRow || inventoryLoading}
          placeholder="Chọn kho xuất vật tư"
          options={allocationInventoryOptions.map((inventory) => {
            const allocatedQuantity = allocations
              .filter(allocation => allocation.inventoryId === inventory.id)
              .reduce((total, allocation) => total + allocation.quantity, 0);
            const remainingQuantity = Math.max(0, Number(inventory.quantity ?? 0) - allocatedQuantity);
            const dimension = Number(inventory.width) > 0 && Number(inventory.height) > 0
              ? ` · ${inventory.width}×${inventory.height} cm`
              : '';
            return {
              value: inventory.id,
              label: `Kho #${inventory.warehouseId} · Mã tồn #${inventory.id} · Còn ${remainingQuantity}${dimension}`,
              disabled: remainingQuantity <= 0,
            };
          })}
          onChange={() => allocationForm.setFieldValue('quantity', undefined)}
        />
      </Form.Item>
      <Form.Item
        name="quantity"
        label="Số lượng"
        rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
      >
        <InputNumber
          min={0.000001}
          max={selectedInventoryRemainingQuantity}
          disabled={!selectedAllocationInventory}
          placeholder="Nhập số lượng xuất"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  </Modal>
);

export default AllocationModal;
