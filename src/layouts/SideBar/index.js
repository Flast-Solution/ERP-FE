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
  OpenAIOutlined,
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
  FileWordOutlined
} from '@ant-design/icons';

import useCollapseSidebar from 'hooks/useCollapseSidebar';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";
import SideBarStyles from './styles';

function getItem(label, key, icon, children) {
  return { key, icon, children, label };
}
const { Sider } = Layout;
const iconSize = { fontSize: 18 };

function SideBar() {

  const { t } = useTranslation();
  const { isCollapseSidebar: collapsed, toggleCollapse } = useCollapseSidebar();

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
    getItem(<Link to="/sale/drag-drop-order">Quy Trình</Link>, 'quy_trinh_don_hang', <ForkOutlined />),
    getItem('Kế toán', 'need_solve', <DollarCircleFilled />, [
      getItem(<Link to="/ke-toan/confirm">Duyệt tiền</Link>, 'list_order_update', <UnorderedListOutlined />),
      getItem(<Link to="/ke-toan/cong-no">Công nợ</Link>, 'can_giai_quyet', <BankOutlined />)
    ]),
    getItem(<Link to="/ai-agent">Trợ lý Ai</Link>, 'ai-agent', <OpenAIOutlined />),
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
      getItem(<Link to="/material/bom">Lệnh S.Xuất</Link>, 'material.bom', <FolderOpenOutlined />)
    ]),
    getItem('Web', 'web', <FileWordOutlined />, [
      getItem(<Link to="/category/san-pham">D.Mục sản phẩm</Link>, 'cate-san-pham', <span> - </span>),
      getItem(<Link to="/category/tin-tuc">D.Mục tin tức</Link>, 'cate-tin-tuc', <span> - </span>),
      getItem(<Link to="/trang-tin-tuc">Trang tin tức</Link>, 'trang-tin-tuc', <span> - </span>),
      getItem(<Link to="/faq">Faq</Link>, 'faq', <span> - </span>)
    ]),
    getItem('Tài khoản', 'tai_khoan', <UserOutlined />, [
      getItem(<Link to="/user/group">Team</Link>, 'user_group', <TeamOutlined />),
      getItem(<Link to="/user/list-system">Tài khoản hệ thống</Link>, 'user_system', <SettingOutlined />)
    ])
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
          <img alt="" src={collapsed ? '/img-intro-login.png' : '/logo.png'} />
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
