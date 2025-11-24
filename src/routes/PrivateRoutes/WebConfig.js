import React from 'react';
import { authRoles } from 'auth';

const CateSanPhamPage = React.lazy(() => import('pages/category/san-pham'));
const CatePage = React.lazy(() => import('pages/category/page'));

export const WebConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/category/san-pham', element: <CateSanPhamPage /> },
    { path     : '/category/tin-tuc', element: <CatePage /> }
  ]
};
