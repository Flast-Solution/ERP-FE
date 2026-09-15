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
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useLocation } from 'react-router-dom';
import ListOrder from '@/containers/Order/List';
import { CoHoi7DayContent } from '@/pages/cohoi7Day';

const COHOI_FILTER = { type: 'cohoi' };

const COHOI_VIEWS = {
  list: {
    title: 'Danh sách cơ hội bán hàng',
    content: () => <ListOrder filter={COHOI_FILTER} />,
  },
  sevenDay: {
    title: 'Danh sách Cơ hội 7 ngày chưa ra đơn hàng',
    content: () => <CoHoi7DayContent type="cohoi" />,
  },
};

const CoHoiPage = () => {
  const { pathname } = useLocation();
  const view = pathname === '/sale/co-hoi/seven-day' ? 'sevenDay' : 'list';
  const currentView = COHOI_VIEWS[view];
  const Content = currentView.content;

  return (
    <div>
      <Helmet>
        <title>{currentView.title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Cơ hội' }, { title: currentView.title }]}
      />
      <Content />
    </div>
  );
};

export default CoHoiPage;
