/**************************************************************************/
/*  PrivateLayout.js                                                      */
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

import { Layout } from 'antd';
import I18n from 'i18next';
import PrivateLayoutWrapper from './styles';
import Header from './Header';
import SideBar from './SideBar';
import Impersonation from './Impersonation';
import OverlayCollapse from './OverlayCollapse';
import MyRoutes from 'routes';

const { Content, Footer } = Layout;
const PrivateLayout = (props) => {
  return (
    <PrivateLayoutWrapper>
      <Layout hasSider className="layout-window-view">
        <SideBar />
        <OverlayCollapse />
        <Layout className="site-layout">
          <Header />
          <Content className="site-layout-background">
            <Impersonation />
            <div className="content" id="status">
              <MyRoutes />
            </div>
            <Footer className="footer">
              {I18n.t('appInfo.footer', { currentYear: new Date().getFullYear(), })}
            </Footer>
          </Content>
        </Layout>
      </Layout>
    </PrivateLayoutWrapper>
  )
}

export default PrivateLayout;