/**************************************************************************/
/*  OrderRoute.js                                                         */
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

const OrderRoute = [
  {
    path: 'sku.add',
    permission: 'sales.opportunity.product.manage',
    Component: tenantOrderComponent('SalesProductPicker', () => import('@/containers/Order/ModalAddSKU')),
    modalOptions: { title: '', width: 900 }
  },
  {
    path: 'order.payment',
    permission: 'sales.order.payment.create',
    Component: tenantOrderComponent('OrderPayment', () => import('@/containers/Order/OrderPayment')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.invoice',
    permission: 'sales.invoice.view',
    Component: tenantOrderComponent('Invoice', () => import('@/containers/Order/Invoice')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.tabs',
    permission: 'sales.order.detail.view',
    Component: tenantOrderComponent('OrderDetail', () => import('@/containers/Order/OrderTabs')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.production.overview',
    permission: 'manufacturing.progress.view',
    Component: tenantOrderComponent('ProductionOverview', () => import('@/containers/Order/ProductionOverview')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.production.detail',
    permission: 'manufacturing.order.detail.view',
    Component: tenantOrderComponent('ProductionOrderDetail', () => import('@/containers/Order/ProductionOrderDetail')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.createQC',
    permission: 'manufacturing.inspection.view',
    Component: tenantOrderComponent('QualityShipment', () => import('@/containers/Order/Shipment')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.evaluate',
    permission: 'manufacturing.inspection.view',
    Component: tenantOrderComponent('QualityEvaluation', () => import('@/containers/Order/OrderEvaluate')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'order.select.detail',
    permission: 'sales.order.detail.view',
    Component: tenantOrderComponent('SelectOrderDetail', () => import('@/containers/Order/SelectDetailModal')),
    modalOptions: { title: 'Chọn sản phẩm', width: 900 }
  }
];

export default OrderRoute;
