/**************************************************************************/
/*  WebRouter.js                                                          */
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

const WebRouter = [
  {
    path: 'cate.sanpham',
    permission: ({ data }) => data?.category?.id ? 'web.product_category.update' : 'web.product_category.create',
    Component: React.lazy(() => import('@/containers/Category/SanPham')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'cate.page',
    permission: ({ data }) => data?.category?.id ? 'web.news_category.update' : 'web.news_category.create',
    Component: React.lazy(() => import('@/containers/Category/Page')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'faq.add',
    permission: ({ data }) => data?.faq?.id ? 'web.faq.update' : 'web.faq.create',
    Component: React.lazy(() => import('@/containers/Faq')),
    modalOptions: { title: '', width: 750 }
  }
];

export default WebRouter;
