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

import { HASH_MODAL, HASH_MODAL_CLOSE } from '@/configs';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { InAppEvent } from '@flast-erp/core/utils';
import { DrawerCustom } from '@flast-erp/core/components';
import useGetMe from '@/hooks/useGetMe';

import ProductRoute from './ProductRoute.js';
import OrderRoute from './OrderRoute';
import LeadRoute from './LeadRouter.js';
import Lead3DayRouter from './Lead3DayRouter.js';
import WareHoseRouter from './WareHouseRouter.js';
import OrderRouter from './UserAccountRouter.js';
import UserGroupRouter from './UserGroupRouter.js';
import Cohoi7DayRouter from './Cohoi7DayRouter.js';
import ActionChamSocDonHangRouter from './ChamSocDonHangRouter.js';
import CommonRoute from './CommonRoute.js';
import WebRouter from './WebRouter.js';
import userRoute from './userRoute.js';
import BusinessUnitRouter from './BusinessUnitRouter.js';

const notFoundHash = { Component: () => <div /> };
const modalRoutes = [
  ...CommonRoute,
  ...WebRouter,
  ...ProductRoute,
  ...OrderRoute,
  ...LeadRoute,
  ...Lead3DayRouter,
  ...WareHoseRouter,
  ...OrderRouter,
  ...UserGroupRouter,
  ...Cohoi7DayRouter,
  ...ActionChamSocDonHangRouter,
  ...userRoute,
  ...BusinessUnitRouter
]

const getModalRoute = (urlHash) => {
  if (!urlHash) {
    return notFoundHash;
  }
  const iHash = urlHash.replaceAll('/', '.')
  const modalRoute = modalRoutes.find(route => iHash.includes(route.path));
  if (!modalRoute) {
    return notFoundHash;
  }
  if (modalRoute['Component']) {
    return modalRoute;
  }
  const route = modalRoute.routes.find(route => iHash.includes(route.path));
  return route || notFoundHash;
};

function ModalRoutes() {
  const { hasPermission } = useGetMe();
  const closeGuardRef = useRef(null);

  const [params, setParams] = useState({ open: false });
  const handleEventDraw = useCallback(({ hash, data, title }) => {
    closeGuardRef.current = null;
    setParams({ open: true, hash, data, title });
  }, []);

  const handleCloseDraw = useCallback(() => {
    closeGuardRef.current = null;
    setParams({ open: false });
  }, []);

  const closeModal = useCallback(() => {
    const close = () => {
      closeGuardRef.current = null;
      setParams({ open: false });
    };
    const closeGuard = closeGuardRef.current;
    if (closeGuard) {
      closeGuard(close);
      return;
    }
    close();
  }, []);

  const registerCloseGuard = useCallback((closeGuard) => {
    closeGuardRef.current = closeGuard;
    return () => {
      if (closeGuardRef.current === closeGuard) {
        closeGuardRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    InAppEvent.addEventListener(HASH_MODAL, handleEventDraw);
    InAppEvent.addEventListener(HASH_MODAL_CLOSE, handleCloseDraw);
    return () => {
      InAppEvent.removeListener(HASH_MODAL, handleEventDraw);
      InAppEvent.removeListener(HASH_MODAL_CLOSE, handleCloseDraw);
    };
  }, [handleEventDraw, handleCloseDraw]);

  const ModalRoute = useMemo(
    () => getModalRoute(params.hash),
    [params.hash],
  );
  const requiredPermission = typeof ModalRoute?.permission === 'function'
    ? ModalRoute.permission(params)
    : ModalRoute?.permission;
  const canOpen = hasPermission(requiredPermission);

  return (
    <DrawerCustom
      {...ModalRoute?.modalOptions}
      title={params?.title || ModalRoute?.modalOptions?.title}
      open={params.open && canOpen}
      onClose={closeModal}
    >
      <ModalRoute.Component
        closeModal={closeModal}
        registerCloseGuard={registerCloseGuard}
        {...params}
      />
    </DrawerCustom>
  );
}

export default ModalRoutes;
