/**************************************************************************/
/*  Order.js                                                              */
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
import TenantPage from '@/components/TenantPage';

const tenantOrderComponent = (page, loader) => {
  const Local = React.lazy(loader);
  return props => <TenantPage {...props} page={page} local={Local} />;
};
const ChoiseSKU = [
  {
    path: 'order.add.status',
    Component: tenantOrderComponent('OrderStatus', () => import('@/containers/Order/ModalEditStatus')),
    modalOptions: { title: '', width: 750 }
  }
];

export default ChoiseSKU;
