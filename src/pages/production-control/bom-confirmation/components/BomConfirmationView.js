import React from 'react';
import { Form } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { CustomButton } from '@flast-erp/core/components';
import ProductionPage from '../../styles';
import AllocationModal from './AllocationModal';
import AllocationSection from './AllocationSection';
import BomMaterialsSection from './BomMaterialsSection';
import BomSelectionSection from './BomSelectionSection';
import ConfirmerSection from './ConfirmerSection';

const BomConfirmationView = ({
  form,
  mode = 'create',
  submitting = false,
  bomItems = [],
  bomVersions = [],
  bomLoading = false,
  bomMaterialGroups = [],
  bomRows = [],
  allocations = [],
  inventoryLoading = false,
  allocationForm,
  allocationModalOpen = false,
  selectedAllocationBomRow,
  allocationInventoryOptions = [],
  selectedAllocationInventory,
  selectedInventoryRemainingQuantity = 0,
  users = [],
  userLoading = false,
  onVersionChange,
  onOpenAllocationModal,
  onCloseAllocationModal,
  onAddAllocation,
  onRemoveAllocation,
  onUserDropdownOpen,
  onUserPopupScroll,
  onSubmit,
  onBack,
  onCancel,
}) => (
  <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="head-row">
          <div>
            <h1>Xác nhận BOM + phân bổ vật tư</h1>
            <div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div>
          </div>
        </div>
      </header>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="body">
          <BomSelectionSection
            bomItems={bomItems}
            bomVersions={bomVersions}
            bomLoading={bomLoading}
            onVersionChange={onVersionChange}
          />
          <BomMaterialsSection
            bomMaterialGroups={bomMaterialGroups}
            bomLoading={bomLoading}
          />
          <AllocationSection
            allocations={allocations}
            inventoryLoading={inventoryLoading}
            bomRows={bomRows}
            onOpenModal={onOpenAllocationModal}
            onRemoveAllocation={onRemoveAllocation}
          />
          <ConfirmerSection
            users={users}
            userLoading={userLoading}
            onUserDropdownOpen={onUserDropdownOpen}
            onUserPopupScroll={onUserPopupScroll}
          />
        </div>
        <footer className="foot">
          <span className="foot-note">Bước 2/2 · Hủy bước này sẽ hủy toàn bộ lệnh sản xuất vừa nhập.</span>
          <div className="actions">
            <CustomButton title="Quay lại" variant="text" color="default" inRigth={false} disabled={submitting} onClick={onBack} />
            <CustomButton title="Hủy lệnh" danger variant="outlined" color="danger" inRigth={false} disabled={submitting} onClick={onCancel} />
            <CustomButton
              title={mode === 'edit' ? 'Xác nhận & cập nhật' : 'Xác nhận & tạo lệnh'}
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              inRigth={false}
              loading={submitting}
              disabled={submitting}
            />
          </div>
        </footer>
      </Form>
    </div>
    <AllocationModal
      open={allocationModalOpen}
      allocationForm={allocationForm}
      bomRows={bomRows}
      allocations={allocations}
      inventoryLoading={inventoryLoading}
      selectedAllocationBomRow={selectedAllocationBomRow}
      allocationInventoryOptions={allocationInventoryOptions}
      selectedAllocationInventory={selectedAllocationInventory}
      selectedInventoryRemainingQuantity={selectedInventoryRemainingQuantity}
      onOk={onAddAllocation}
      onCancel={onCloseAllocationModal}
    />
  </ProductionPage>
);

export default BomConfirmationView;
