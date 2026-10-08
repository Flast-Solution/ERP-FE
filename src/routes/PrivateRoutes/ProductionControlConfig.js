import React from 'react';
import { authRoles } from '@/auth';
import TenantPage from '@/components/TenantPage';

const LocalProductionOrderPage = React.lazy(() => import('@/pages/production-control'));
const ProductionOrderPage = () => <TenantPage page="ProductionOrders" local={LocalProductionOrderPage} />;

export const ProductionControlConfig = {
    auth: authRoles.user,
    routes: [
    { path: '/material/bom', permission: 'manufacturing.order.view', element: <ProductionOrderPage /> }
    ]
};
