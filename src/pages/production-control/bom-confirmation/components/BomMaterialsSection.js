import React from 'react';
import { Table } from 'antd';

const MATERIAL_COLUMNS = [
  { title: 'Tên vật tư', dataIndex: 'name' },
  { title: 'Quy cách', dataIndex: 'specification', width: 145 },
  { title: 'SL cần', dataIndex: 'requiredQuantity', align: 'right' },
  { title: 'Tồn kho', dataIndex: 'stockQuantity', align: 'right' },
  { title: 'Trạng thái', dataIndex: 'status', align: 'center' },
];

const BomMaterialsSection = ({
  bomMaterialGroups = [],
  bomLoading = false,
}) => (
  <section className="section">
    <div className="section-head"><span className="section-no">2</span><h2>Vật tư theo BOM</h2></div>
    <div className="bom-material-list">
      {bomMaterialGroups.map(group => (
        <div className="bom-material-card" key={group.key}>
          <div className="bom-material-card__head">
            <span>{group.title}</span>
            <strong>{group.orderLabel}</strong>
            <em>{group.version ? `Version ${group.version}` : 'Chưa chọn Version'}</em>
          </div>
          <Table
            loading={bomLoading}
            columns={MATERIAL_COLUMNS}
            dataSource={group.rows}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: 'Chưa có dữ liệu vật tư' }}
            scroll={{ x: 650 }}
          />
        </div>
      ))}
    </div>
  </section>
);

export default BomMaterialsSection;
