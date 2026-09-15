/**************************************************************************/
/*  @/routes/ModalRoutes/OmniModalRoute.js                                */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import React from 'react';
const OmniModalRoute = [
  {
    path: 'omni.lead.create',
    Component: React.lazy(() => import('@/containers/OmniChannel/LeadCreateDrawer')),
    modalOptions: { title: '', width: 620 }
  }
];

export default OmniModalRoute;
