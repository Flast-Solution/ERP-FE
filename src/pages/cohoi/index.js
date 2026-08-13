/**************************************************************************/
/* pages.cohoi.index.js                                                   */
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

const COHOI_FILTER = { type: 'cohoi' };

const COHOI_NAV_ITEMS = [
  { key: 'list', label: 'Danh sách cơ hội bán hàng' },
  { key: 'seven-day', label: 'Danh sách Cơ hội 7 ngày chưa ra đơn hàng' },
];

const COHOI_TAB_TITLES = {
  list: 'Danh sách cơ hội bán hàng',
  'seven-day': 'Danh sách Cơ hội 7 ngày chưa ra đơn hàng',
};

const CoHoiPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeKey = COHOI_TAB_TITLES[requestedTab] ? requestedTab : 'list';
  const title = COHOI_TAB_TITLES[activeKey];

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Cơ hội' }, { title }]}
      />
      <Menu
        mode="horizontal"
        selectedKeys={[activeKey]}
        items={COHOI_NAV_ITEMS}
        onClick={({ key }) => {
          if (key === 'seven-day') {
            setSearchParams({ tab: key });
            return;
          }
          setSearchParams({});
        }}
        style={{ marginBottom: 16, background: 'transparent' }}
      />
      {activeKey === 'seven-day'
        ? <CoHoi7DayContent type="cohoi" />
        : <ListOrder filter={COHOI_FILTER} />}
    </div>
  );
};

export default CoHoiPage;
