import React, { useEffect, useRef, useState } from 'react';
import { Typography, Table, Row, Col, message, Form } from 'antd';
import HeaderCompany from 'components/common/HeaderCompany';
import { StyledHeaderInvoice } from "css/global";
import CustomButton from 'components/CustomButton';
import FormSelectAPI from 'components/form/FormSelectAPI';
import { useReactToPrint } from "react-to-print";
import { arrayEmpty, f5List } from 'utils/dataUtils';
import RequestUtils from 'utils/RequestUtils';

const { Title, Text } = Typography;
const generateListProduct = (warehouse, ship) => {
  if(arrayEmpty(warehouse?.skuDetails)) {
    return []
  }
  const { note, quantity } = ship;
  const { product } = warehouse;
  let name = String(product.name);
  for(let item of warehouse.skuDetails) {
    const { text, values } = item;
    name = name.concat(" - ").concat(text).concat(": ").concat(values.map(v => v.text).join(","));
  }
  return [{
    id: product.id,
    unit: product.unit,
    name,
    note,
    quantity
  }];
}

const DeliveryPager = ( { data }) => {
  
  const contentRef = useRef();
  const reactToPrintFn = useReactToPrint({ contentRef });

  const [ form ] = Form.useForm();
  const [ products, setProducts ] =  useState([]);

  useEffect(() => {
    const domContent = document.getElementById("drawer-content");
    domContent.style.padding = "0px 24px";
    return () => domContent.style.padding = "16px 24px";
  }, []);

  useEffect(() => {
    form.setFieldValue('status', data.status);
    const { warehouseProduct, ...rest } = data;
    const lists = generateListProduct(warehouseProduct, rest);
    setProducts(lists);
  }, [data, form]);

  const columns = [
    {
      title: 'STT',
      dataIndex: 'id',
      key: 'id',
      width: 50
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Đơn vị tính',
      dataIndex: 'unit',
      key: 'unit',
      width: 100
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note'
    }
  ];

  const onFinish = async ({ status }) => {
    if(arrayEmpty(products)) {
      message.error("Lỗi không có sản phẩm giao !");
      return;
    }
    const { warehouseProduct, ...model } = data;
    const { message: MSG } = await RequestUtils.Post("/shipping/update", { ...model, status });
    message.success(MSG);
    f5List("shipping/fetch")
  }

  const totalQuantity = products.reduce((sum, product) => sum + product.quantity, 0);
  return <>
    <StyledHeaderInvoice ref={contentRef} style={{background: '#fff', padding: '50px 30px', marginBottom: 40}}>
      <HeaderCompany />
      <Title level={3} style={{ textAlign: 'center', margin: '30px 0px' }}>
        PHIẾU XUẤT KHO
      </Title>

      <Title level={5} style={{ marginBottom: '15px' }}>Danh sách sản phẩm xuất kho:</Title>
      <Table
        dataSource={products}
        columns={columns}
        pagination={false}
        rowKey="id"
        bordered
        size="small"
      />

      <div style={{ marginTop: '15px', textAlign: 'right' }}>
        <Text strong>Tổng số lượng: </Text>
        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>{totalQuantity}</Text>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <Text strong>Người nhận hàng</Text>
          <br />
          <Text>(Ký, ghi rõ họ tên)</Text>
          <br /><br /><br />
          <Text>____________________</Text>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Text strong>Người xuất hàng</Text>
          <br />
          <Text>(Ký, ghi rõ họ tên)</Text>
          <br /><br /><br />
          <Text>____________________</Text>
        </div>
      </div>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <Text italic>Ghi chú: Phiếu xuất kho này được lập thành 02 bản, trong đó:</Text>
        <br />
        <Text italic>- 01 bản giao cho người nhận hàng</Text>
        <br />
        <Text italic>- 01 bản kế toán lưu</Text>
      </div>
    </StyledHeaderInvoice>

    <Form form={form} onFinish={onFinish} >
      <Row gutter={24} style={{padding: 10}}>
        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath="shipping/fetch-status"
            name="status"
            placeholder={"Chọn trạng thái"}
          />
        </Col>
        <Col md={10} xs={24}>
          <CustomButton 
            htmlType="submit"
            variant="outlined" 
            title="Cập nhật trạng thái" 
            inRigth={false}
          />
        </Col>
        <Col md={2} xs={24}>
          <CustomButton onClick={reactToPrintFn} title="In phiếu" />
        </Col>
      </Row>
    </Form>
  </>
};

export default DeliveryPager;