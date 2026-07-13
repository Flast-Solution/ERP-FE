import React from 'react';
import { authRoles } from '@/auth';

const ProductionOrderPage = React.lazy(() => import('@/pages/production-control'));

export const ProductionControlConfig = {
    auth: authRoles.user,
    routes: [
        { path: '/material/bom', element: <ProductionOrderPage /> }
    ]
};
