import React from 'react'
import { authRoles } from '@/auth';

const ContentPage = React.lazy(() => import('@/pages/workflow-designer'));
const FormBuilderPage = React.lazy(() => import('@/pages/form-builder'));
const FormListPage = React.lazy(() => import('@/pages/form-list'));

export const WorkflowDesignerConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/workflow-designer', element: <ContentPage /> },
    { path     : '/workflow-forms', element: <FormListPage /> },
    { path     : '/workflow-form/:id', element: <FormBuilderPage /> },
    { path     : '/workflow-form/*', element: <FormBuilderPage /> },
    { path     : '/workflow-form', element: <FormBuilderPage /> }
  ]
};
