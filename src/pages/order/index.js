/**************************************************************************/
/*  index.js                                                           		*/
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React from 'react';
import { Helmet } from "react-helmet";
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useLocation } from 'react-router-dom';
import ListOrder from '@/containers/Order/List';
import { CoHoi7DayContent } from '@/pages/cohoi7Day';
import { OrderCancelContent } from './Cancel';

const ORDER_VIEWS = {
  list: {
    title: 'Danh sách đơn hàng',
  },
  afterSale: {
    title: 'Đơn hàng chưa chăm sóc sau bán',
  },
  cancelled: {
    title: 'Danh sách đơn hủy',
  },
};

const OrderPage = () => {
  const { pathname, search } = useLocation();
  const view = pathname === '/sale/order/after-sale'
    ? 'afterSale'
    : pathname === '/sale/order/cancelled'
      ? 'cancelled'
      : 'list';
  const currentView = ORDER_VIEWS[view];
  const filterParams = Object.fromEntries(new URLSearchParams(search).entries());
  const filter = { type: 'order', ...filterParams };

  const renderContent = () => {
    if (view === 'afterSale') {
      return <CoHoi7DayContent type="order" />;
    }
    if (view === 'cancelled') {
      return <OrderCancelContent />;
    }
    return <ListOrder filter={filter} />;
  };

  return (
    <div>
      <Helmet>
        <title>{currentView.title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Đơn hàng' }, { title: currentView.title }]}
      />
      {renderContent()}
    </div>
  );
};

export default OrderPage;
