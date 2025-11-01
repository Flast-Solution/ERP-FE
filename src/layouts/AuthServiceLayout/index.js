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

import { Layout } from 'antd';
import PublicLayoutWrapper from './styles';
const { Content } = Layout;

const PublicLayout = ({ children }) => (
  <PublicLayoutWrapper>
    <Layout className="layout">
      <Content className="main-img">
        <img src="/img-intro-login.png" id="content" alt="Content Auth" />
      </Content>
      <div className="main-content">
        <img alt="" src="/logo.png" className="auth-service-layout__logo" />
        <div className="auth-service-layout__content">{children}</div>
      </div>
    </Layout>
  </PublicLayoutWrapper>
);

export default PublicLayout;
