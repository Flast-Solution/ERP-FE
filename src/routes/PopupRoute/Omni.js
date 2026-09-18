/**************************************************************************/
/*  @/routes/PopupRoute/Omni.js                                           */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import React from 'react';

const Omni = [
  {
    path: 'omni.customer.duplicated',
    Component: React.lazy(() => import('@/containers/OmniChannel/DuplicateCustomerPopup')),
    modalOptions: { title: '', width: 560 }
  },
  {
    path: 'omni.customer.search',
    Component: React.lazy(() => import('@/containers/OmniChannel/CustomerSearchPopup')),
    modalOptions: { title: '', width: 560 }
  }
];

export default Omni;