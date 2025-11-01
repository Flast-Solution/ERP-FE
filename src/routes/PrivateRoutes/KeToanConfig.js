import React from 'react';
import { authRoles } from 'auth';

const DuyetTienPage = React.lazy(() => import('pages/ketoan/DuyetTien'));
const CongnoConfigPage = React.lazy(() => import('pages/ketoan'));

export const KeToanConfig = {
    auth    : authRoles.user,
    routes  : [
        { path     : '/ke-toan/cong-no', element: <CongnoConfigPage /> },
        { path     : '/ke-toan/confirm', element: <DuyetTienPage /> }
    ]
};
