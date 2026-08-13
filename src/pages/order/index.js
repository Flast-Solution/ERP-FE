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
import { Menu } from 'antd';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useSearchParams } from 'react-router-dom';
import ListOrder from '@/containers/Order/List';
import { CoHoi7DayContent } from '@/pages/cohoi7Day';
import { OrderCancelContent } from './Cancel';

const ORDER_NAV_ITEMS = [
  { key: 'list', label: 'Danh sách đơn hàng' },
  { key: 'after-sale', label: 'Đơn hàng chưa chăm sóc sau bán' },
  { key: 'cancelled', label: 'Danh sách đơn hủy' },
];

const ORDER_TAB_TITLES = {
  list: 'Danh sách đơn hàng',
  'after-sale': 'Đơn hàng chưa chăm sóc sau bán',
  cancelled: 'Danh sách đơn hủy',
};

const OrderPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeKey = ORDER_TAB_TITLES[requestedTab] ? requestedTab : 'list';
  const title = ORDER_TAB_TITLES[activeKey];
  const filterParams = Object.fromEntries(searchParams.entries());
  delete filterParams.tab;
  const filter = { type: 'order', ...filterParams };

  const changeTab = (key) => {
    const nextParams = new URLSearchParams(searchParams);
    if (key === 'list') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', key);
    }
    setSearchParams(nextParams);
  };

  const renderContent = () => {
    if (activeKey === 'after-sale') {
      return <CoHoi7DayContent type="order" />;
    }
    if (activeKey === 'cancelled') {
      return <OrderCancelContent />;
    }
    return <ListOrder filter={filter} />;
  };

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Đơn hàng' }, { title }]}
      />
      <Menu
        mode="horizontal"
        selectedKeys={[activeKey]}
        items={ORDER_NAV_ITEMS}
        onClick={({ key }) => changeTab(key)}
        style={{ marginBottom: 16, background: 'transparent' }}
      />
      {renderContent()}
    </div>
  );
};

export default OrderPage;
