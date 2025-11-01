/**************************************************************************/
/*  App.js                                                                */
/**************************************************************************/
/*                        Tệp này là một phần của:                        */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bùi                  */
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

import 'Main.less';
import { useEffect, Suspense } from 'react';
import { ThemeProvider } from 'styled-components';
import theme from 'theme';
import i18n from './i18n';
import moment from 'moment';
import { Auth } from 'auth';
import { DataProvider } from 'DataContext';
import { BrowserRouter } from 'react-router-dom';
import history from "@history";
import Authorization from 'auth/Authorization';
import MainLayout from 'layouts/MainLayout';
import MyPopup from 'routes/PopupRoute';
import Loading from 'components/Loading';
import ModalRoutes from 'routes/ModalRoutes';

const ThemeRender = () => (
  <ThemeProvider theme={theme}>
    <Auth>
      <Authorization>
        <MainLayout />
      </Authorization>
    </Auth>
    <Suspense fallback={<Loading />}>
      <ModalRoutes />
      <MyPopup />
    </Suspense>
  </ThemeProvider>
);

function App() {

  useEffect(() => {
    moment.locale(i18n.language);
  }, []);

  return (
    <DataProvider>
      <BrowserRouter location={history.location} navigator={history}>
        <ThemeRender />
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
