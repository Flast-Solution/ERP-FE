/**************************************************************************/
/*  userRoute.js                                                          */
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

const dataRoute = [
  {
    path: 'user.edit',
    Component: React.lazy(() => import('containers/UserAcount')),
    modalOptions: { title: '', width: 750 }
  },
  // {
  //   path: 'nghiphep.edit',
  //   Component: React.lazy(() => import('containers/NghiPhep')),
  //   modalOptions: { title: '', width: 750 }
  // },
  // {
  //   path: 'nghiphep.confirm',
  //   Component: React.lazy(() => import('containers/NghiPhep/NPConfirm')),
  //   modalOptions: { title: '', width: 750 }
  // },
  // {
  //   path: 'overtime.edit',
  //   Component: React.lazy(() => import('containers/Overtime')),
  //   modalOptions: { title: '', width: 750 }
  // },
  // {
  //   path: 'overtime.confirm',
  //   Component: React.lazy(() => import('containers/Overtime/OVConfirm')),
  //   modalOptions: { title: '', width: 750 }
  // },
  {
    path: 'booking.car.edit',
    Component: React.lazy(() => import('containers/Booking/BookingCar')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'booking.car.confirm',
    Component: React.lazy(() => import('containers/Booking/BookingConfirm')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'booking.hotel.edit',
    Component: React.lazy(() => import('containers/Booking/BookingHotel')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'booking.hotel.confirm',
    Component: React.lazy(() => import('containers/Booking/BookingConfirm')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'booking.flight.edit',
    Component: React.lazy(() => import('containers/Booking/BookingFlight')),
    modalOptions: { title: '', width: 750 }
  },
  {
    path: 'booking.flight.confirm',
    Component: React.lazy(() => import('containers/Booking/BookingConfirm')),
    modalOptions: { title: '', width: 750 }
  }
];

export default dataRoute;
