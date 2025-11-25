import React from 'react';
import { authRoles } from 'auth';

const CateSanPhamPage = React.lazy(() => import('pages/category/san-pham'));
const CatePage = React.lazy(() => import('pages/category/page'));
const FaqPage = React.lazy(() => import('pages/faq'));
const ContentPage = React.lazy(() => import('pages/post'));
const ContentEdit = React.lazy(() => import('pages/post/Edit'));

export const WebConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/category/san-pham', element: <CateSanPhamPage /> },
    { path     : '/category/tin-tuc', element: <CatePage /> },
    { path     : '/faq', element: <FaqPage /> },
    { path     : '/post', element: <ContentPage /> },
    { path     : '/post/edit', element: <ContentEdit /> }
  ]
};
