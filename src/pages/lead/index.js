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

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Menu } from 'antd';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useSearchParams } from 'react-router-dom';
import LeadList from './LeadList';
import LeadReport from './LeadReport';
import { Lead3DayContent } from '@/pages/lead3Day';

const LEAD_NAV_ITEMS = [
  { key: 'list', label: 'Danh sách Lead' },
  { key: 'three-day', label: 'Khách hàng 3 ngày chưa ra cơ hội bán hàng' },
  { key: 'report', label: 'Báo cáo' },
]

const LEAD_TAB_TITLES = {
  list: 'Danh sách Lead',
  'three-day': 'Khách hàng 3 ngày chưa ra cơ hội bán hàng',
  report: 'Báo cáo',
}

const LeadPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeKey = LEAD_TAB_TITLES[requestedTab] ? requestedTab : 'list'
  const title = useMemo(() => LEAD_TAB_TITLES[activeKey], [activeKey])

  const renderContent = () => {
    if (activeKey === 'report') return <LeadReport />
    if (activeKey === 'three-day') return <Lead3DayContent />
    return <LeadList />
  }

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: 'Lead' }, { title }]}
      />
      <Menu
        mode="horizontal"
        selectedKeys={[activeKey]}
        items={LEAD_NAV_ITEMS}
        onClick={({ key }) => {
          if (key !== 'list') {
            setSearchParams({ tab: key })
            return
          }
          setSearchParams({})
        }}
        style={{ marginBottom: 16, background: 'transparent' }}
      />
      {renderContent()}
    </div>
  )
}

export default LeadPage
