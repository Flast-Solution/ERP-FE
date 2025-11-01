import React from 'react';
import { authRoles } from 'auth';

const Cohoi7DayPage = React.lazy(() => import('pages/cohoi7Day'));
export const Cohoi7DayConfig = {
    auth    : authRoles.admin,
    routes  : [
        { path     : '/customer-service/co-hoi', element: <Cohoi7DayPage type='cohoi' /> },
        { path     : '/customer-service/don-hang', element: <Cohoi7DayPage type='order' /> }
    ]
};