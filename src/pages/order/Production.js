import React, { useState } from 'react';
import { Button, message, Tabs } from 'antd';
import { Helmet } from "react-helmet";
import { BreadcrumbCustom as CustomBreadcrumb } from '@flast-erp/core/components';
import ListOrder from 'containers/Order/List';
import { InAppEvent } from "@flast-erp/core/utils";
import { HASH_MODAL } from 'configs';

const OrderProductionPage = () => {
  const [ title ] = useState("Đơn hàng đang sản xuất");
  
  // Status ID của trạng thái "Đang sản xuất"
  const STATUS_PRODUCTION = 2; 
  
  const urlParams = new URLSearchParams(window.location.search);
  const filter = { 
    type: "order", 
    detailStatus: STATUS_PRODUCTION,
    ...urlParams 
  };

  const onEvaluate = (record) => {
    // Mở form tạo lô kiểm tra chất lượng
    InAppEvent.emit(HASH_MODAL, {
      hash: '#qc.inspection.batch',
      title: 'Lô kiểm tra - ' + (record.code || record.orderDetailCode),
      data: {
        orderDetailCode: record.code,
        productCode: record.productCode,
        customerOrder: record
      }
    });
  };

  const extraActions = [
    {
      children: 'Đánh giá',
      type: 'default',
      style: { color: '#52c41a', borderColor: '#52c41a' },
      onClick: onEvaluate
    }
  ];

  const items = [
    {
      key: '1',
      label: 'Đơn hàng đang SX',
      children: <ListOrder filter={filter} hideQuoteButton={true} extraActions={extraActions} />
    },
    {
      key: '2',
      label: 'Danh sách lô hàng',
      children: ''
    },
  ];
  
  return <>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <CustomBreadcrumb
      data={[{ title: 'Trang chủ' }, { title: title }]}
    />
    {/* <ListOrder filter={filter} hideQuoteButton={true} extraActions={extraActions} /> */}
    <Tabs defaultActiveKey="1" items={items} />
  </>
};

export default OrderProductionPage;
