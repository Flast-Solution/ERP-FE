import React from 'react'
import { authRoles } from '@/auth';

const ContentPage = React.lazy(() => import('@/pages/workflow-designer'));

export const WorkflowDesignerConfig = {
  auth    : authRoles.user,
  routes  : [
    { path     : '/workflow-designer', element: <ContentPage /> }
  ]
};
