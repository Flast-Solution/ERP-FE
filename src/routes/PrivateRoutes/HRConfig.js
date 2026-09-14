import React from 'react';
import { authRoles } from '@/auth';

const EmployeePage = React.lazy(() => import('@/pages/employee'));
const CalendarPage = React.lazy(() => import('@/pages/scheduler'));
const BookingPage = React.lazy(() => import('@/pages/booking'));
const LeavePage = React.lazy(() => import('@/pages/nghiphep'));
const OvertimePage = React.lazy(() => import('@/pages/overtime'));

export const HRConfig = {
    auth: authRoles.user,
    routes: [
        { path: '/employee', permission: 'hr.employee.view', element: <EmployeePage /> },
        { path: '/cleander', permission: ['hr.calendar.view', 'hr.timesheet.view'], element: <CalendarPage /> },
        { path: '/booking', permission: ['hr.booking.car.view', 'hr.booking.flight.view', 'hr.booking.hotel.view'], element: <BookingPage /> },
        { path: '/leave', permission: 'hr.leave.view', element: <LeavePage /> },
        { path: '/overtime', permission: 'hr.overtime.view', element: <OvertimePage /> },
    ]
};
