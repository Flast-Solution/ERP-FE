/**************************************************************************/
/*  @/routes/PrivateRoutes/OmniConfig.js                                  */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import React from 'react';
import { authRoles } from '@/auth';

const OmniInboxPage = React.lazy(() => import('@/pages/omni'));
/* const OmniChannelSettingPage = React.lazy(() => import('@/pages/omni/ChannelSetting')); */

export const OmniConfig = {
  auth: authRoles.user,
  routes: [
    { path: '/omni/inbox', element: <OmniInboxPage /> },
    { path: '/omni/channel', element: <OmniInboxPage /> }
  ]
};
