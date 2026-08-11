/**************************************************************************/
/*  HomeConfig.js                                                         */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React from 'react';
import { authRoles } from '@/auth';

const HomePage = React.lazy(() => import('@/pages/newFeed'));
const TaskPage = React.lazy(() => import('@/pages/task'));
const TaskCalendar = React.lazy(() => import('@/pages/task/MyCalendar'));
const ProfilePage = React.lazy(() => import('@/pages/profile'));
const GeneralConfigPage = React.lazy(() => import('@/pages/generalConfig'));
const ProviderPage = React.lazy(() => import('@/pages/provider'));
const DocumentTemplateListPage = React.lazy(() => import('@/pages/document-template'));
const DocumentTemplateEditorPage = React.lazy(() => import('@/pages/document-template/Editor'));
const NotificationsPage = React.lazy(() => import('@/pages/notifications'));

export const CommonConfig = {
    auth: authRoles.user,
    routes: [
        { path: '/', element: <HomePage /> },
        { path: '/profile', element: <ProfilePage /> },
        { path: '/system/general-config', element: <GeneralConfigPage /> },
        { path: '/provider', element: <ProviderPage /> },
        { path: '/system/document-templates', element: <DocumentTemplateListPage /> },
        { path: '/system/document-templates/create', element: <DocumentTemplateEditorPage /> },
        { path: '/system/document-templates/:templateId/edit', element: <DocumentTemplateEditorPage /> },
        { path: '/notifications', element: <NotificationsPage /> },
        { path: '/task', element: <TaskPage /> },
        { path: '/task/calendar/:id', element: <TaskCalendar /> }
    ]
};
