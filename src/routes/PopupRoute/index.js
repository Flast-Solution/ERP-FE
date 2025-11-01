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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HASH_POPUP, HASH_POPUP_CLOSE } from 'configs/constant';
import { InAppEvent } from 'utils/FuseUtils';
import { Modal } from 'antd';
import { NoFooter } from 'components/common/NoFooter';
import { createGlobalStyle } from 'styled-components';

import Order from './Order';
import NhapKho from './NhapKho';
import Cusomter from './Customer';
import KPI from './KPI';

const CustomModalStyles = createGlobalStyle`
  .custom-modal {
    top: 50%;
    max-height: 90vh;
    overflow: auto;
  }
  .custom-modal .ant-modal-content .ant-modal-header .ant-modal-title {
    font-size: 20px;
    font-weight: 500;
  }
`;

const Common = [
  {
    path: 'task.add',
    Component: React.lazy(() => import('containers/Works/TaskForm')),
    modalOptions: { title: '', width: 600 }
  },
  {
    path: 'material.add',
    Component: React.lazy(() => import('containers/Material')),
    modalOptions: { title: '', width: 600 }
  }
];

const modalRoutes = [
  ...Common,
  ...Order,
  ...NhapKho,
  ...Cusomter,
  ...KPI
];

const getPopupRoute = (currentModal) => {
  const routeNotFound = { Component: () => <div /> }
  if (!currentModal) {
    return routeNotFound;
  }
  const modalRoute = modalRoutes.find(route => currentModal.includes(route.path));
  if (modalRoute && modalRoute['Component']) {
    return modalRoute;
  }
  return routeNotFound;
};

function MyPopup() {

  const [params, setParams] = useState({ open: false });
  const [reLoad, setReload] = useState(false);

  const handleEventDraw = useCallback(({ hash, data, title }) => {
    setParams({ open: true, hash, data, title });
  }, []);

  const handleCloseDraw = useCallback(() => {
    setParams({ open: false });
  }, []);

  useEffect(() => {
    InAppEvent.addEventListener(HASH_POPUP, handleEventDraw);
    InAppEvent.addEventListener(HASH_POPUP_CLOSE, handleCloseDraw);
    return () => {
      InAppEvent.removeListener(HASH_POPUP, handleEventDraw);
      InAppEvent.removeListener(HASH_POPUP_CLOSE, handleCloseDraw);
    };
  }, [handleEventDraw, handleCloseDraw]);

  const closePopup = useCallback(() => {
    setParams({ open: false });
    setReload(pre => !pre);
  }, []);

  const PopupRoute = useMemo(
    () => getPopupRoute(params.hash),
    [params.hash]
  );

  return <>
    <CustomModalStyles />
    <Modal
      {...PopupRoute?.modalOptions}
      title={params?.title || ''}
      open={params.open}
      onCancel={closePopup}
      footer={<NoFooter />}
      wrapClassName="custom-modal"
      width={PopupRoute?.modalOptions?.width || 800}
    >
      <PopupRoute.Component
        reLoad={reLoad}
        closeModal={closePopup}
        {...(params.data || {})}
      />
    </Modal>
  </>;
}

export default MyPopup;
