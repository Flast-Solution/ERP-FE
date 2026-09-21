import React from 'react'
import { authRoles } from '@/auth';

const ContentPage = React.lazy(() => import('@/pages/workflow-designer'));
const FormBuilderPage = React.lazy(() => import('@/pages/form-builder'));
const FormListPage = React.lazy(() => import('@/pages/form-list'));

export const WorkflowDesignerConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/workflow-designer', permission: 'workflow.process.view', element: <ContentPage /> },
    { path     : '/workflow-forms', permission: 'workflow.form.view', element: <FormListPage /> },
    { path     : '/workflow-form/:id', permission: 'workflow.form.update', element: <FormBuilderPage /> },
    { path     : '/workflow-form/*', permission: ['workflow.form.create', 'workflow.form.update'], element: <FormBuilderPage /> },
    { path     : '/workflow-form', permission: 'workflow.form.create', element: <FormBuilderPage /> }
  ]
};
