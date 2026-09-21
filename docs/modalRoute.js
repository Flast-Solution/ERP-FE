
import { HASH_MODAL, HASH_MODAL_CLOSE } from '@/configs';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { InAppEvent } from '@flast-erp/core/utils';
import { DrawerCustom } from '@flast-erp/core/components';

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
  ...BusinessUnitRouter,
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

  const [params, setParams] = useState({ open: false });
  const handleEventDraw = useCallback(({ hash, data, title }) => {
    setParams({ open: true, hash, data, title });
  }, []);

  const handleCloseDraw = useCallback(() => {
    setParams({ open: false });
  }, []);

  useEffect(() => {
    InAppEvent.addEventListener(HASH_MODAL, handleEventDraw);
    InAppEvent.addEventListener(HASH_MODAL_CLOSE, handleCloseDraw);
    return () => {
      InAppEvent.removeListener(HASH_MODAL, handleEventDraw);
      InAppEvent.removeListener(HASH_MODAL_CLOSE, handleCloseDraw);
    };
  }, [handleEventDraw, handleCloseDraw]);

  const closeModal = useCallback(() => {
    setParams({ open: false })
  }, []);

  const ModalRoute = useMemo(
    () => getModalRoute(params.hash),
    [params.hash],
  );

  return (
    <DrawerCustom
      {...ModalRoute?.modalOptions}
      title={params?.title || ModalRoute?.modalOptions?.title}
      open={params.open}
      onClose={closeModal}
    >
      <ModalRoute.Component closeModal={closeModal} {...params} />
    </DrawerCustom>
  );
}

export default ModalRoutes;
