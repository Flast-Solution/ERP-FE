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
  ScheduleOutlined,
  AppstoreOutlined,
  AuditOutlined,
  // OpenAIOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  BankOutlined,
  FundViewOutlined,
  ForkOutlined,
  WalletOutlined,
  TagOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  GiftOutlined,
  BuildOutlined,
  DeliveredProcedureOutlined,
  FileWordOutlined,
  SolutionOutlined,
  CalendarOutlined,
  BookOutlined,
  FieldTimeOutlined,
  UsergroupAddOutlined,
  RotateLeftOutlined
} from '@ant-design/icons';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useCollapseSidebar } from '@flast-erp/core/hooks';
import { RequestUtils } from '@flast-erp/core/utils';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import SideBarStyles from './styles';
import useGetMe from '@/hooks/useGetMe';
import { BUSINESS_UPDATED_EVENT, getTokenPayload, isSuperAdmin } from '@/utils/authUtils';

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}
const { Sider } = Layout;
const iconSize = { fontSize: 18 };

const USER_BUSINESS_INFO_API = '/auth/user-bussiness/find-info';

const isAbsoluteUrl = (value = '') =>
  /^https?:\/\//i.test(String(value)) || String(value).startsWith('/api/');

const resolveLogoUrl = (logo) => {
  if (!logo) return '';
  if (isAbsoluteUrl(logo)) return logo;
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '');
  return `${baseUrl}/upload/folder/view?filename=${encodeURIComponent(logo)}`;
};

function SideBar() {

  const { t } = useTranslation();
  const { isCollapseSidebar: collapsed, toggleCollapse } = useCollapseSidebar();
  const { user } = useGetMe();
  const canManageBusinessUnits = isSuperAdmin(user);
  const [businessLogo, setBusinessLogo] = useState('');

  const bizId = user?.bizId ?? user?.biz_id ?? getTokenPayload()?.bizId ?? null;

  useEffect(() => {
    if (!bizId) return undefined;

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

  const items = [
    getItem(<Link to="/sale/report-common">{t('sideBar.dashboard')}</Link>, 'home', <FundViewOutlined />),
    getItem(<Link to="/task">Dự án</Link>, 'project_list', <PieChartOutlined />),
    getItem(<Link to="/lead">Lead</Link>, 'tong_lead', <FolderOpenOutlined />),
    getItem('Chăm sóc K.H', 'chua_cham_soc', <FolderOpenOutlined style={iconSize} />, [
      getItem(<Link to="/customer-service/lead">Lead</Link>, "cs_lead", <ScheduleOutlined />),
      getItem(<Link to="/customer-service/co-hoi">Cơ hội</Link>, "cs_co_hoi", <AppstoreOutlined />),
      getItem(<Link to="/customer-service/don-hang">Đơn hàng</Link>, "cs_don_hang", <AuditOutlined />)
    ]),
    getItem(<Link to="/sale/co-hoi"> Cơ hội </Link>, 'co_hoi', <TagOutlined />),
    getItem('Đơn hàng', 'order_solve', <PaperClipOutlined style={iconSize} />, [
      getItem(<Link to="/sale/order">Tổng hợp</Link>, 'list_order', <UnorderedListOutlined />),
      getItem(<Link to="/sale/order-cancel">Đơn hủy</Link>, 'order_cancel', <DeleteOutlined />)
    ]),
    getItem('Qui trình', 'business_flow', <DollarCircleFilled />, [
      getItem(<Link to="/workflow-designer">Tạo nghiệp vụ</Link>, 'business_create', <UnorderedListOutlined />),
      getItem(<Link to="/workflow-forms">Danh sách form</Link>, 'workflow_form_list', <UnorderedListOutlined />),
      // Tạm ẩn: trong danh sách form đã có nút tạo mới.
      // getItem(<Link to="/workflow-form">Tạo Form nhập</Link>, 'workflow_form', <UnorderedListOutlined />),
      getItem(<Link to="/sale/drag-drop-order">Quy trình đơn</Link>, 'business_order', <ForkOutlined />),
    ]),
    getItem('Kế toán', 'need_solve', <DollarCircleFilled />, [
      getItem(<Link to="/ke-toan/confirm">Duyệt tiền</Link>, 'list_order_update', <UnorderedListOutlined />),
      getItem(<Link to="/ke-toan/cong-no">Công nợ</Link>, 'can_giai_quyet', <BankOutlined />)
    ]),
    // Tạm ẩn menu Trợ lý AI.
    // getItem(<Link to="/ai-agent">Trợ lý Ai</Link>, 'ai-agent', <OpenAIOutlined />),
    getItem('Khách hàng', 'client', <WalletOutlined />, [
      getItem(<Link to="/sale/m-customer">Khách lẻ</Link>, 'customer', <GroupOutlined />),
      getItem(<Link to="/customer/enterprise">Doanh nghiệp</Link>, 'enterprice', <GroupOutlined />)
    ]),
    getItem('Kho - Giao hàng', 'warehouse', <OrderedListOutlined />, [
      getItem(<Link to="/warehouse/trong-kho"> Trong kho </Link>, 'tt-theo-don', <UnorderedListOutlined />),
      getItem(<Link to="/ship"> Giao hàng </Link>, 'da-giao-theo-don', <GiftOutlined />),
      getItem(<Link to="/warehouse/danh-sach-kho">Danh sách kho</Link>, 'd.s.kho', <DeploymentUnitOutlined />)
    ]),
    getItem(<Link to="/kpi"> Kpi</Link>, 'Kpi', <RiseOutlined />),
    getItem(<Link to="/bot">Bot dữ liệu</Link>, 'bot_data', <PullRequestOutlined />),
    getItem(<Link to="/product"> Sản phẩm</Link>, 'product_list', <UngroupOutlined />),
    getItem('Sản xuất', 'san_xuat', <BuildOutlined />, [
      getItem(<Link to="/material">Nguyên V.Liệu</Link>, 'material', <DeliveredProcedureOutlined />),
      getItem(<Link to="/provider">Nhà cung cấp</Link>, 'provider', <TeamOutlined />),
      getItem(<Link to="/material/bom">Lệnh S.Xuất</Link>, 'material.bom', <FolderOpenOutlined />),
      getItem(<Link to="/sale/order-production">ĐH đang sản xuất</Link>, 'order.production', <BuildOutlined />),
    ]),
    // Tạm ẩn menu Quản lý QC.
    // getItem('Quản lý QC', 'qc_management', <AuditOutlined />, [
    //   getItem(<Link to="/qc/criteria">Tiêu chí</Link>, 'qc_criteria', <UnorderedListOutlined />),
    //   getItem(<Link to="/qc/checklist">Bộ tiêu chí</Link>, 'qc_checklist', <OrderedListOutlined />),
    //   getItem(<Link to="/qc/defect">Danh sách lỗi</Link>, 'qc_defect', <DeleteOutlined />)
    // ]),
    getItem('Web', 'web', <FileWordOutlined />, [
      getItem(<Link to="/category/san-pham">D.Mục sản phẩm</Link>, 'cate-san-pham', <span> - </span>),
      getItem(<Link to="/category/tin-tuc">D.Mục tin tức</Link>, 'cate-tin-tuc', <span> - </span>),
      getItem(<Link to="/post">Trang tin tức</Link>, 'post', <span> - </span>),
      getItem(<Link to="/faq">Faq</Link>, 'faq', <span> - </span>),
      getItem(<Link to="/tag">Quản lý Tag</Link>, 'tag', <span> - </span>),
      getItem(<Link to="/landing/edit">Quản lý trang</Link>, 'page', <span> - </span>)
    ]),
    getItem('Tài khoản', 'tai_khoan', <UserOutlined />, [
      ...(canManageBusinessUnits
        ? [getItem(<Link to="/system/business-units">Đơn vị sử dụng</Link>, 'business_units', <BankOutlined />)]
        : []),
      getItem(<Link to="/system/general-config">Cấu hình chung</Link>, 'general_config', <SettingOutlined />),
      getItem(<Link to="/user/group">Team</Link>, 'user_group', <TeamOutlined />),
      getItem(<Link to="/user/list-system">Tài khoản hệ thống</Link>, 'user_system', <SettingOutlined />)
    ]),
    getItem('Quản lý hành chính', 'quan_ly_hanh_chinh', <SolutionOutlined />, [
      getItem(<Link to="/employee">Nhân viên</Link>, 'employee', <UsergroupAddOutlined />),
      getItem(<Link to="/cleander">Lịch</Link>, 'cleander', <CalendarOutlined />),
      getItem(<Link to="/booking">Booking</Link>, 'booking', <BookOutlined />),
      getItem(<Link to="/leave">Nghỉ phép</Link>, 'leave', <RotateLeftOutlined />),
      getItem(<Link to="/overtime">Tăng ca</Link>, 'overtime', <FieldTimeOutlined />)]), 
  ];

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
            src={collapsed
              ? (businessLogo || '/img-intro-login.png')
              : (businessLogo || '/logo.png')}
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
