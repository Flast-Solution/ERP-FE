import React, { useMemo } from "react";
import { Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { CustomButton, CustomButtonIcon } from "@flast-erp/core/components";

const AllocationSection = ({
  allocations = [],
  inventoryLoading = false,
  bomRows = [],
  onOpenModal,
  onRemoveAllocation,
}) => {
  const allocationColumns = useMemo(
    () => [
      {
        title: "Tên vật tư",
        dataIndex: "materialName",
      },
      {
        title: "Kho xuất",
        dataIndex: "warehouseId",
        render: (value) => `Kho #${value}`,
      },
      {
        title: "Mã tồn kho",
        dataIndex: "inventoryId",
        render: (value) => (value == null ? "-" : `#${value}`),
      },
      {
        title: "Tồn kho",
        dataIndex: "availableQuantity",
        align: "right",
      },
      {
        title: "SL xuất",
        dataIndex: "quantity",
        align: "right",
      },
      {
        title: "",
        width: 54,
        align: "center",
        render: (_, row) => (
          <CustomButtonIcon
            title="Xóa phân bổ"
            icon={<DeleteOutlined />}
            handleClick={() => onRemoveAllocation(row.id)}
          />
        ),
      },
    ],
    [onRemoveAllocation],
  );

  return (
    <section className="section">
      <div className="section-head">
        <span className="section-no">3</span>
        <h2>Phân bổ lô xuất kho</h2>
        <div style={{ marginLeft: "auto" }}>
          <CustomButton
            title="Thêm vật tư"
            icon={<PlusOutlined />}
            type="primary"
            htmlType="button"
            inRigth={false}
            disabled={bomRows.length === 0}
            onClick={onOpenModal}
          />
        </div>
      </div>
      <Table
        loading={inventoryLoading}
        columns={allocationColumns}
        dataSource={allocations}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: "Chưa có vật tư được phân bổ" }}
        scroll={{ x: 900 }}
      />
    </section>
  );
};

export default AllocationSection;
