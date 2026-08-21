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
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useLocation } from 'react-router-dom';
import LeadList from './LeadList';
import LeadReport from './LeadReport';
import { Lead3DayContent } from '@/pages/lead3Day';

const LEAD_VIEWS = {
  list: {
    title: 'Danh sách Lead',
    content: LeadList,
  },
  threeDay: {
    title: 'Khách hàng 3 ngày chưa ra cơ hội bán hàng',
    content: Lead3DayContent,
  },
  report: {
    title: 'Báo cáo',
    content: LeadReport,
  },
}

const getLeadViewFromPath = (pathname) => {
  if (pathname === '/lead/three-day') return 'threeDay'
  if (pathname === '/lead/report') return 'report'
  return 'list'
}

const LeadPage = () => {
  const { pathname } = useLocation()
  const view = getLeadViewFromPath(pathname)
  const currentView = LEAD_VIEWS[view] ?? LEAD_VIEWS.list
  const Content = currentView.content

  return (
    <div>
      <Helmet>
        <title>{currentView.title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Lead' }, { title: currentView.title }]}
      />
      <Content />
    </div>
  )
}

export default LeadPage
