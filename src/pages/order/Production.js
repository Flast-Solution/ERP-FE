import React, { useState } from 'react';
import { Button, message } from 'antd';
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import ListOrder from 'containers/Order/List';
import { InAppEvent } from "@flast-erp/core/utils/FuseUtils";
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
    // TODO: Mở form đánh giá đơn hàng
    message.info(`Đánh giá đơn hàng: ${record.code}`);
    // Ví dụ mở modal:
    // InAppEvent.emit(HASH_MODAL, {
    //   hash: '#draw/order.evaluate',
    //   title: 'Đánh giá đơn hàng #' + record.code,
    //   data: record
    // });
  };

  const extraActions = [
    {
      children: 'Đánh giá',
      type: 'default',
      style: { color: '#52c41a', borderColor: '#52c41a' },
      onClick: onEvaluate
    }
  ];
  
  return <>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <CustomBreadcrumb
      data={[{ title: 'Trang chủ' }, { title: title }]}
    />
    <ListOrder filter={filter} hideQuoteButton={true} extraActions={extraActions} />
  </>
};

export default OrderProductionPage;
