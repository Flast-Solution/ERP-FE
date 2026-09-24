import React, { useEffect, useRef, useState } from 'react';
import { Typography, Table, Row, Col, message, Form, Descriptions } from 'antd';
import { StyledHeaderInvoice } from "@/css/global";
import { HeaderCompany, FormSelectAPI, CustomButton } from "@flast-erp/core/components";

import { useReactToPrint } from "react-to-print";
import { RequestUtils, arrayEmpty, f5List } from '@flast-erp/core/utils';
import useGetMe from '@/hooks/useGetMe';

const { Title, Text } = Typography;
const generateListProduct = ship => (
  (Array.isArray(ship?.lots) ? ship.lots : []).map((lot, index) => ({
    id: lot?.historyId ?? `${ship?.id ?? 'delivery'}-${index}`,
    productLabel: [
      ship?.productId ? `SP #${ship.productId}` : null,
      ship?.skuId ? `SKU #${ship.skuId}` : null
    ].filter(Boolean).join(' · ') || '—',
    receiptCode: lot?.receiptCode,
    lotNo: lot?.lotNo,
    stockLabel: [lot?.stockName, lot?.binLocation].filter(Boolean).join(' · '),
    quantity: Number(lot?.quantity ?? 0)
  }))
);

const DeliveryPager = ( { data }) => {
  const { hasPermission } = useGetMe();
  const canUpdate = hasPermission('shipping.delivery.update');
  const canPrint = hasPermission('shipping.delivery.print');
  
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
    setProducts(generateListProduct(data));
  }, [data, form]);

  const columns = [
    {
      title: 'STT',
      key: 'id',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Sản phẩm / SKU',
      dataIndex: 'productLabel',
      key: 'productLabel'
    },
    {
      title: 'Lô',
      dataIndex: 'lotNo',
      key: 'lotNo',
      width: 110,
      render: value => value || '—'
    },
    {
      title: 'Phiếu nhập',
      dataIndex: 'receiptCode',
      key: 'receiptCode',
      width: 180,
      render: value => value || '—'
    },
    {
      title: 'Kho · vị trí',
      dataIndex: 'stockLabel',
      key: 'stockLabel',
      width: 180,
      render: value => value || '—'
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    }
  ];

  const onFinish = async ({ status }) => {
    if(arrayEmpty(products)) {
      message.error("Lỗi không có sản phẩm giao !");
      return;
    }
    const { message: MSG } = await RequestUtils.Post("/shipping/update", { ...data, status });
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
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Mã phiếu xuất">{data?.deliveryCode || '—'}</Descriptions.Item>
        <Descriptions.Item label="Mã đơn">{data?.orderCode || '—'}</Descriptions.Item>
        <Descriptions.Item label="Người nhận">{data?.delivery?.recipientName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{data?.delivery?.recipientPhone || '—'}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ" span={2}>{data?.delivery?.address || '—'}</Descriptions.Item>
      </Descriptions>
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
        {canUpdate && <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath="shipping/fetch-status"
            name="status"
            placeholder={"Chọn trạng thái"}
          />
        </Col>}
        {canUpdate && <Col md={10} xs={24}>
          <CustomButton 
            htmlType="submit"
            variant="outlined" 
            title="Cập nhật trạng thái" 
            inRigth={false}
          />
        </Col>}
        {canPrint && <Col md={2} xs={24}>
          <CustomButton onClick={reactToPrintFn} title="In phiếu" />
        </Col>}
      </Row>
    </Form>
  </>
};

export default DeliveryPager;
