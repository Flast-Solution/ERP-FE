/**************************************************************************/
/*  index.js                                                              */
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

import { Menu, Layout } from 'antd';
import {
  FolderOpenOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  GroupOutlined,
  RiseOutlined,
  PullRequestOutlined,
  UngroupOutlined,
  DollarCircleFilled,
  OrderedListOutlined,
  DeploymentUnitOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  BankOutlined,
  FundViewOutlined,
  ForkOutlined,
  WalletOutlined,
  TagOutlined,
  PaperClipOutlined,
  GiftOutlined,
  BuildOutlined,
  DeliveredProcedureOutlined,
  FileWordOutlined,
  FileAddOutlined,
  SolutionOutlined,
  CalendarOutlined,
  BookOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
  RotateLeftOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

import { useEffect, useState } from 'react';
import { useCollapseSidebar } from '@flast-erp/core/hooks';
import { RequestUtils } from '@flast-erp/core/utils';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import SideBarStyles from './styles';
import useGetMe from '@/hooks/useGetMe';
import { resolveUploadUrl } from '@/containers/PreviewModal/uploadUtils';
import {
  BUSINESS_UPDATED_EVENT,
  canManagePermissions,
  hasClientPermission,
  isSuperAdmin,
} from '@/utils/authUtils';
import { GATEWAY } from '@/configs';

function getItem(label, key, icon, children, permission) {
  return { key, icon, children, label, permission };
}

const filterItemsByPermission = (items, user) => items.reduce((result, item) => {
  const children = item.children ? filterItemsByPermission(item.children, user) : undefined;
  if (item.children && !children.length) {
    return result;
  }
  if (item.permission && !hasClientPermission(user, item.permission)) {
    return result;
  }
  const { permission: _permission, ...menuItem } = item;
  result.push({ ...menuItem, ...(children ? { children } : {}) });
  return result;
}, []);

const { Sider } = Layout;
const iconSize = { fontSize: 18 };

const USER_BUSINESS_INFO_API = '/auth/user-bussiness/find-info';

const isAbsoluteUrl = (value = '') =>
  /^https?:\/\//i.test(String(value)) || String(value).startsWith('/api/');

const resolveLogoUrl = (logo) => {
  if (!logo) {
    return '';
  }
  if (isAbsoluteUrl(logo)) {
    return logo;
  }
  return `${GATEWAY}/erp/folder/view/${encodeURIComponent(logo)}`;
};

function SideBar() {

  const { t } = useTranslation();
  const { isCollapseSidebar: collapsed, toggleCollapse } = useCollapseSidebar();
  const { user } = useGetMe();
  const [ businessLogo, setBusinessLogo ] = useState('');

  const canManageBusinessUnits = isSuperAdmin(user);
  const canManageUserPermissions = canManagePermissions(user);
  const bizId = user?.bizId ?? null;

  useEffect(() => {
    if (!bizId) {
      return undefined;
    }

    let mounted = true;
    (async () => {
      try {
        const response = await RequestUtils.Get(USER_BUSINESS_INFO_API, { bizId });
        const info = response?.data?.data ?? response?.data ?? null;
        if (mounted && info?.logo) {
          setBusinessLogo(resolveLogoUrl(info.logo));
        }
      } catch (error) {
        console.warn('[SideBar] fetch business logo failed', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bizId]);

  useEffect(() => {
    const handleBusinessUpdated = (event) => {
      const logo = event?.detail?.logo;
      setBusinessLogo(logo ? resolveLogoUrl(logo) : '');
    };

    window.addEventListener(BUSINESS_UPDATED_EVENT, handleBusinessUpdated);
    return () => window.removeEventListener(BUSINESS_UPDATED_EVENT, handleBusinessUpdated);
  }, []);

  const items = filterItemsByPermission([
    getItem(<Link to="/sale/report-common">{t('sideBar.dashboard')}</Link>, 'home', <FundViewOutlined />, undefined, 'dashboard.view'),
    getItem(<Link to="/task">Dự án</Link>, 'project_list', <PieChartOutlined />, undefined, 'project.view'),
    getItem('Lead', 'tong_lead', <FolderOpenOutlined />, [
      getItem(<Link to="/lead">Danh sách Lead</Link>, 'lead_list', <UnorderedListOutlined />, undefined, 'sales.lead.view'),
      getItem(
        <Link to="/lead/three-day">Khách hàng 3 ngày chưa ra cơ hội bán hàng</Link>,
        'lead_three_day',
        <FieldTimeOutlined />, undefined, 'sales.lead.overdue.view',
      ),
      getItem(<Link to="/lead/report">Báo cáo</Link>, 'lead_report', <FundViewOutlined />, undefined, 'sales.lead.report.view'),
    ]),
    getItem('Cơ hội', 'co_hoi', <TagOutlined />, [
      getItem(<Link to="/sale/co-hoi">Danh sách cơ hội bán hàng</Link>, 'co_hoi_list', <UnorderedListOutlined />, undefined, 'sales.opportunity.view'),
      getItem(
        <Link to="/sale/co-hoi/seven-day">Danh sách Cơ hội 7 ngày chưa ra đơn hàng</Link>,
        'co_hoi_seven_day',
        <FieldTimeOutlined />, undefined, 'sales.opportunity.overdue.view',
      ),
    ]),
    getItem('Đơn hàng', 'order_solve', <PaperClipOutlined style={iconSize} />, [
      getItem(<Link to="/sale/order">Danh sách đơn hàng</Link>, 'order_list', <UnorderedListOutlined />, undefined, 'sales.order.view'),
      getItem(
        <Link to="/sale/order/after-sale">Đơn hàng chưa chăm sóc sau bán</Link>,
        'order_after_sale',
        <FieldTimeOutlined />, undefined, 'sales.order.after_sale.view',
      ),
      getItem(<Link to="/sale/order/cancelled">Danh sách đơn hủy</Link>, 'order_cancelled', <OrderedListOutlined />, undefined, 'sales.order.cancelled.view'),
    ]),
    getItem('Qui trình', 'business_flow', <DollarCircleFilled />, [
      getItem(<Link to="/workflow-designer">Tạo nghiệp vụ</Link>, 'business_create', <UnorderedListOutlined />, undefined, 'workflow.process.view'),
      getItem(<Link to="/workflow-forms">Danh sách form</Link>, 'workflow_form_list', <UnorderedListOutlined />, undefined, 'workflow.form.view'),
      getItem(<Link to="/sale/drag-drop-order">Quy trình đơn</Link>, 'business_order', <ForkOutlined />, undefined, 'workflow.order_board.view'),
    ]),
    getItem('Kế toán', 'need_solve', <DollarCircleFilled />, [
      getItem(<Link to="/ke-toan/confirm">Duyệt tiền</Link>, 'list_order_update', <UnorderedListOutlined />, undefined, 'accounting.payment_approval.view'),
      getItem(<Link to="/ke-toan/cong-no">Công nợ</Link>, 'can_giai_quyet', <BankOutlined />, undefined, 'accounting.receivable.view')
    ]),
    getItem('Khách hàng', 'client', <WalletOutlined />, [
      getItem(<Link to="/sale/m-customer">Khách lẻ</Link>, 'customer', <GroupOutlined />, undefined, 'customer.retail.view'),
      getItem(<Link to="/customer/enterprise">Doanh nghiệp</Link>, 'enterprice', <GroupOutlined />, undefined, 'customer.enterprise.view')
    ]),
    getItem('Kho - Giao hàng', 'warehouse', <OrderedListOutlined />, [
      getItem(<Link to="/warehouse/trong-kho"> Trong kho </Link>, 'tt-theo-don', <UnorderedListOutlined />, undefined, 'inventory.stock.view'),
      getItem(<Link to="/ship"> Giao hàng </Link>, 'da-giao-theo-don', <GiftOutlined />, undefined, 'shipping.delivery.view'),
      getItem(<Link to="/warehouse/danh-sach-kho">Danh sách kho</Link>, 'd.s.kho', <DeploymentUnitOutlined />, undefined, 'inventory.warehouse.view')
    ]),
    getItem(<Link to="/kpi"> Kpi</Link>, 'Kpi', <RiseOutlined />, undefined, 'kpi.view'),
    getItem(<Link to="/bot">Bot dữ liệu</Link>, 'bot_data', <PullRequestOutlined />, undefined, 'sales.lead.cold.view'),
    getItem(<Link to="/product"> Sản phẩm</Link>, 'product_list', <UngroupOutlined />, undefined, 'catalog.product.view'),
    getItem('Sản xuất', 'san_xuat', <BuildOutlined />, [
      getItem(<Link to="/material">Nguyên V.Liệu</Link>, 'material', <DeliveredProcedureOutlined />, undefined, 'material.view'),
      getItem(<Link to="/provider">Nhà cung cấp</Link>, 'provider', <TeamOutlined />, undefined, 'supplier.view'),
      getItem(<Link to="/material/bom">Lệnh S.Xuất</Link>, 'material.bom', <FolderOpenOutlined />, undefined, 'manufacturing.order.view'),
      getItem(<Link to="/sale/order-production">ĐH đang sản xuất</Link>, 'order.production', <BuildOutlined />, undefined, 'manufacturing.progress.view'),
    ]),
    getItem('Web', 'web', <FileWordOutlined />, [
      getItem(<Link to="/category/san-pham">D.Mục sản phẩm</Link>, 'cate-san-pham', <span> - </span>, undefined, 'web.product_category.view'),
      getItem(<Link to="/category/tin-tuc">D.Mục tin tức</Link>, 'cate-tin-tuc', <span> - </span>, undefined, 'web.news_category.view'),
      getItem(<Link to="/post">Trang tin tức</Link>, 'post', <span> - </span>, undefined, 'web.post.view'),
      getItem(<Link to="/faq">Faq</Link>, 'faq', <span> - </span>, undefined, 'web.faq.view'),
      getItem(<Link to="/tag">Quản lý Tag</Link>, 'tag', <span> - </span>, undefined, 'web.tag.view'),
      getItem(<Link to="/landing">Quản lý trang</Link>, 'page', <span> - </span>, undefined, 'web.landing.view')
    ]),
    getItem('Tài khoản', 'tai_khoan', <UserOutlined />, [
      ...(canManageBusinessUnits
        ? [getItem(<Link to="/system/business-units">Đơn vị sử dụng</Link>, 'business_units', <BankOutlined />, undefined, 'system.business_unit.view')]
        : []),
      getItem(<Link to="/system/general-config">Cấu hình chung</Link>, 'general_config', <SettingOutlined />, undefined, 'system.config.view'),
      getItem(<Link to="/system/document-templates">Tạo chứng từ</Link>, 'document_templates', <FileAddOutlined />, undefined, 'system.document_template.view'),
      getItem(<Link to="/user/group">Team</Link>, 'user_group', <TeamOutlined />, undefined, 'system.team.view'),
      getItem(<Link to="/user/list-system">Tài khoản hệ thống</Link>, 'user_system', <SettingOutlined />, undefined, 'system.user.view'),
      ...(canManageUserPermissions
        ? [getItem(<Link to="/user/permissions">Phân quyền</Link>, 'user_permissions', <SafetyCertificateOutlined />)]
        : [])
    ]),
    getItem('Quản lý hành chính', 'quan_ly_hanh_chinh', <SolutionOutlined />, [
      getItem(<Link to="/employee">Nhân viên</Link>, 'employee', <UsergroupAddOutlined />, undefined, 'hr.employee.view'),
      getItem(<Link to="/cleander">Lịch</Link>, 'cleander', <CalendarOutlined />, undefined, ['hr.calendar.view', 'hr.timesheet.view']),
      getItem(<Link to="/booking">Booking</Link>, 'booking', <BookOutlined />, undefined, ['hr.booking.car.view', 'hr.booking.flight.view', 'hr.booking.hotel.view']),
      getItem(<Link to="/leave">Nghỉ phép</Link>, 'leave', <RotateLeftOutlined />, undefined, 'hr.leave.view'),
      getItem(<Link to="/overtime">Tăng ca</Link>, 'overtime', <FieldTimeOutlined />, undefined, 'hr.overtime.view')]),
  ], user);

  return (
    <SideBarStyles>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="sidebar"
        collapsedWidth={65}
        width={220}
        theme="light"
      >
        <div className="logo" onClick={toggleCollapse}>
          <img
            alt=""
            className={businessLogo ? 'business-logo' : ''}
            src={ collapsed
              ? (businessLogo || '/img-intro-login.png')
              : (businessLogo || '/logo.png')
            }
          />
        </div>
        <Menu
          mode="inline"
          items={items}
        />
      </Sider>
    </SideBarStyles>
  )
};

export default SideBar;
