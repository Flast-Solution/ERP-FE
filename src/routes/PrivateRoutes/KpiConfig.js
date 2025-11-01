import React from 'react';
import { authRoles } from 'auth';

const KPIPage = React.lazy(() => import('pages/kpi'));
export const KpiConfig = {
    auth    : authRoles.user,
    routes  : [
        { path     : '/kpi', element: <KPIPage /> }
    ]
};
