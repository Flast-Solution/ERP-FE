import React, { useState } from 'react';
import { Form, message, Table } from 'antd';
import { DeleteOutlined, PlusOutlined, RightOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  CustomButtonIcon,
  FormInput,
  FormSelect,
} from '@flast-erp/core/components';
import ProductionPage from './styles';

const BomConfirmation = () => {
  const [rows, setRows] = useState([]);
  const remove = id => setRows(value => value.filter(row => row.id !== id));
  const add = () => setRows(value => [...value,{id:Date.now(),name:'',lot:'',qty:''}]);
  const materialColumns = [
    { title: 'Tên vật tư', dataIndex: 'name' },
    { title: 'Mã lô IQC', dataIndex: 'lot' },
    { title: 'SL cần', dataIndex: 'requiredQuantity', align: 'right' },
    { title: 'Tồn kho', dataIndex: 'stockQuantity', align: 'right' },
    { title: 'Trạng thái', dataIndex: 'status', align: 'center' },
  ];
  const allocationColumns = [
    {
      title: 'Tên vật tư',
      render: (_, row) => <FormInput name={['allocations', row.id, 'name']} placeholder="Nhập tên vật tư" />,
    },
    {
      title: 'Mã lô xuất kho',
      render: (_, row) => <FormInput name={['allocations', row.id, 'lot']} placeholder="Nhập mã lô" />,
    },
    {
      title: 'SL xuất',
      align: 'right',
      render: (_, row) => <FormInput name={['allocations', row.id, 'quantity']} placeholder="Nhập số lượng" />,
    },
    {
      title: '',
      width: 54,
      align: 'center',
      render: (_, row) => <CustomButtonIcon title="Xóa dòng" icon={<DeleteOutlined />} handleClick={() => remove(row.id)} />,
    },
  ];

  return <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="crumb"><span>Kiểm soát sản xuất</span><RightOutlined /><span className="current">Xác nhận BOM + phân bổ vật tư</span></div>
        <div className="head-row"><div><h1>Xác nhận BOM + phân bổ vật tư</h1><div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div></div></div>
      </header>
      <Form layout="vertical" onFinish={() => message.success('Đã xác nhận và phân bổ vật tư')}>
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Phiên bản BOM</h2></div>
          <div className="grid">
            <FormSelect required name="bomId" label="Chọn BOM" placeholder="Chọn BOM" resourceData={[]} />
            <FormInput name="version" label="Version" placeholder="Nhập phiên bản" />
            <FormSelect name="status" label="Trạng thái BOM" placeholder="Chọn trạng thái" resourceData={[]} />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Vật tư theo BOM</h2></div>
          <Table columns={materialColumns} dataSource={[]} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dữ liệu vật tư' }} scroll={{ x: 720 }} />
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">3</span><h2>Phân bổ lô xuất kho</h2></div>
          <Table columns={allocationColumns} dataSource={rows} rowKey="id" pagination={false} locale={{ emptyText: 'Chưa có dòng phân bổ' }} scroll={{ x: 720 }} />
          <div className="table-action"><CustomButton title="Thêm dòng" icon={<PlusOutlined />} variant="dashed" color="default" inRigth={false} onClick={add} /></div>
        </section>
        <section className="section"><div className="grid"><FormSelect required name="confirmedBy" label="Người xác nhận" placeholder="Chọn người xác nhận" resourceData={[]} /></div></section>
      </div>
      <footer className="foot"><span className="foot-note">BOM phải được duyệt để submit. Tồn kho thiếu cần Production Manager phê duyệt.</span><div className="actions"><CustomButton title="Lưu nháp" variant="outlined" color="default" inRigth={false} onClick={()=>message.success('Đã lưu nháp')} /><CustomButton title="Xác nhận & phân bổ" type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} /></div></footer>
      </Form>
    </div>
  </ProductionPage>;
};

export default BomConfirmation;
