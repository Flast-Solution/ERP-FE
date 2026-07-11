import React from 'react';
import { authRoles } from '@/auth';

const CreateOrder = React.lazy(() => import('@/pages/production-control/CreateOrder'));
const BomConfirmation = React.lazy(() => import('@/pages/production-control/BomConfirmation'));

export const ProductionControlConfig = {
  auth: authRoles.user,
  routes: [
    { path: '/production-control/create-order', element: <CreateOrder /> },
    { path: '/production-control/bom-confirmation', element: <BomConfirmation /> }
  ]
};
