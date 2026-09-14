import React from 'react';
import { authRoles } from '@/auth';

const CateSanPhamPage = React.lazy(() => import('@/pages/category/san-pham'));
const CatePage = React.lazy(() => import('@/pages/category/page'));
const FaqPage = React.lazy(() => import('@/pages/faq'));
const ContentPage = React.lazy(() => import('@/pages/post'));
const ContentEdit = React.lazy(() => import('@/pages/post/Edit'));
const TagPage = React.lazy(() => import('@/pages/tag'));
const TagEditPage = React.lazy(() => import('@/pages/tag/Edit'));
const Landing = React.lazy(() => import('@/pages/landing'));
const LandingEdit = React.lazy(() => import('@/pages/landing/Edit'));
const WebPageRuntime = React.lazy(() => import('@/containers/Landing/WebPageRuntime'));

export const PublicWebConfig = {
  routes: [
    { path: '/m/:pageId/*', element: <WebPageRuntime /> }
  ]
};

export const WebConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/category/san-pham', permission: 'web.product_category.view', element: <CateSanPhamPage /> },
    { path     : '/category/tin-tuc', permission: 'web.news_category.view', element: <CatePage /> },
    { path     : '/faq', permission: 'web.faq.view', element: <FaqPage /> },
    { path     : '/post', permission: 'web.post.view', element: <ContentPage /> },
    { path     : '/post/edit', permission: ({ search }) => new URLSearchParams(search).has('id') ? 'web.post.update' : 'web.post.create', element: <ContentEdit /> },
    { path     : '/tag', permission: 'web.tag.view', element: <TagPage /> },
    { path     : '/tag/edit', permission: ({ search }) => new URLSearchParams(search).has('id') ? 'web.tag.update' : 'web.tag.create', element: <TagEditPage /> },
    { path     : '/landing', permission: 'web.landing.view', element: <Landing /> },
    { path     : '/landing/edit', permission: ({ search }) => new URLSearchParams(search).get('mode') === 'create' ? 'web.landing.create' : 'web.landing.update', element: <LandingEdit /> }
  ]
};
