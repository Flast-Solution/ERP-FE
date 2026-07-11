import React from 'react';
import { Form, message } from 'antd';
import { RightOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CustomButton,
  FormDatePicker,
  FormInput,
  FormRadioGroup,
  FormSelect,
  FormTextArea,
} from '@flast-erp/core/components';
import ProductionPage from './styles';

const PRIORITIES = [
  { value: 'high', name: 'Cao' },
  { value: 'medium', name: 'Trung bình' },
  { value: 'low', name: 'Thấp' },
];

const CreateOrder = () => {
  const notify = (text) => message.success(text);

  return <ProductionPage>
    <div className="production-card">
      <header className="page-head">
        <div className="crumb"><span>Kiểm soát sản xuất</span><RightOutlined /><span className="current">Tạo lệnh sản xuất</span></div>
        <div className="head-row"><div><h1>Tạo lệnh sản xuất</h1><div className="subtitle">WF2 Sản xuất · ISO 9001:2015 §8.5</div></div></div>
      </header>
      <Form layout="vertical" onFinish={() => notify('Đã tạo lệnh sản xuất')}>
      <div className="body">
        <section className="section">
          <div className="section-head"><span className="section-no">1</span><h2>Đơn hàng khách</h2></div>
          <div className="grid">
            <FormInput name="productionOrderCode" label="Mã lệnh SX" placeholder="Nhập mã lệnh sản xuất" />
            <FormSelect required name="salesOrderId" label="Đơn hàng chờ SX" placeholder="Chọn đơn hàng" resourceData={[]} />
            <FormInput name="customerName" label="Khách hàng" placeholder="Nhập khách hàng" />
            <FormInput name="fabricType" label="Loại vải" placeholder="Nhập loại vải" />
          </div>
        </section>
        <section className="section">
          <div className="section-head"><span className="section-no">2</span><h2>Chi tiết sản xuất</h2></div>
          <div className="grid">
            <FormInput required name="fabricWidth" label="Khổ vải (cm)" placeholder="Nhập khổ vải" />
            <FormInput required name="fabricDensity" label="Mật độ dệt" placeholder="Nhập mật độ dệt" />
            <FormInput required name="targetColor" label="Mã màu yêu cầu" placeholder="Nhập mã màu" />
            <FormSelect name="labDipRef" label="Lab dip" placeholder="Chọn Lab dip" resourceData={[]} />
            <FormInput required name="quantityMeters" label="Số mét cần SX" placeholder="Nhập số mét" />
            <FormDatePicker required name="deadline" label="Deadline giao hàng" placeholder="Chọn ngày" format="DD/MM/YYYY" />
            <FormRadioGroup required name="priority" label="Độ ưu tiên" className="radio-group" resourceData={PRIORITIES} valueProp="value" titleProp="name" />
            <div className="field full"><FormTextArea name="notes" label="Ghi chú" placeholder="Ghi chú thêm cho lệnh sản xuất…" rows={4} /></div>
          </div>
        </section>
      </div>
      <footer className="foot"><span className="foot-note">Trường bắt buộc đánh dấu *. Submit sẽ tạo lệnh SX và chuyển sang xác nhận BOM.</span><div className="actions"><CustomButton title="Lưu nháp" variant="outlined" color="default" inRigth={false} onClick={()=>notify('Đã lưu nháp')} /><CustomButton title="Tạo lệnh SX" type="primary" htmlType="submit" icon={<SaveOutlined />} inRigth={false} /></div></footer>
      </Form>
    </div>
  </ProductionPage>;
};

export default CreateOrder;
