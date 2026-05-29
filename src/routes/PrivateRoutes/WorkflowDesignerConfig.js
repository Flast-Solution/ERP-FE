import React from 'react'
import { authRoles } from '@/auth';

const ContentPage = React.lazy(() => import('@/pages/workflow-designer'));
const FormBuilderPage = React.lazy(() => import('@/pages/form-builder'));

export const WorkflowDesignerConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/workflow-designer', element: <ContentPage /> },
    { path     : '/workflow-form', element: <FormBuilderPage /> }
  ]
};
