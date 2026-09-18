
import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { BreadcrumbCustom } from '@flast-erp/core/components';
import ListOrder from '@/containers/Order/List';

const OrderPage = () => {
  const [ title ] = useState("Danh sách đơn hàng");
  const urlParams = new URLSearchParams(window.location.search);
  const filter = { type: "order", ...urlParams }

  return <>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <BreadcrumbCustom
      data={[{ title: 'Trang chủ' }, { title: title }]}
    />
    <ListOrder filter={filter} />
  </>
};

export default OrderPage;
