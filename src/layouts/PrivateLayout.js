
import { Layout } from 'antd';
import I18n from 'i18next';
import logger from '@/logger';
import { bumpTitle } from '@/utils/tools';
import PrivateLayoutWrapper from '@/layouts/styles';
import Header from '@/layouts/Header';
import SideBar from '@/layouts/SideBar';
import Impersonation from '@/layouts/Impersonation';
import OverlayCollapse from '@/layouts/OverlayCollapse';
import MyRoutes from '@/routes';
import useGetMe from '@/hooks/useGetMe';
import {
  useSocketEvents,
  useAppSocketProvider,
  useSocketTopic
} from '@/hooks/useAppSocket';
import { WS_EVENT, WS_TOPIC } from '@/services/socketEvents';

const { Content, Footer } = Layout
const ContentLayout = () => (
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
);

const PrivateLayout = () => {

  const user = useGetMe()
  useAppSocketProvider()
  useSocketTopic(WS_TOPIC.OMNI_NOTIFYCATION, user.id)
  useSocketEvents({
    [WS_EVENT.ORDER_APPROVED]: (payload) => {
      logger.info('[layouts.private] NOTI ORDER_APPROVED:', payload)
    },
    [WS_EVENT.NOTY_MESSAGE_NEW]: (payload) => {
      if (!window.location.pathname.startsWith('/omni')) {
        bumpTitle(payload.displayName)
      }
    }
  })

  return (
    <PrivateLayoutWrapper>
      <Layout hasSider className="layout-window-view">
        <SideBar />
        <OverlayCollapse />
        <ContentLayout />
      </Layout>
    </PrivateLayoutWrapper>
  )
};

export default PrivateLayout;
