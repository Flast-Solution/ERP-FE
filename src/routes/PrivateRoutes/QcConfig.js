import React from 'react';
import { authRoles } from '@/auth';

const CriteriaPage = React.lazy(() => import('@/pages/qc/criteria'));
const ChecklistPage = React.lazy(() => import('@/pages/qc/checklist'));
const DefectPage = React.lazy(() => import('@/pages/qc/defect'));

export const QcConfig = {
    auth: authRoles.admin,
    routes: [
        { path: '/qc/criteria', element: <CriteriaPage /> },
        { path: '/qc/checklist', element: <ChecklistPage /> },
        { path: '/qc/defect', element: <DefectPage /> },
    ]
};
