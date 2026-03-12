import React from 'react';
import { authRoles } from 'auth';

const EmployeePage = React.lazy(() => import('pages/employee'));
const CalendarPage = React.lazy(() => import('pages/scheduler'));
const BookingPage = React.lazy(() => import('pages/booking'));
const LeavePage = React.lazy(() => import('pages/nghiphep'));
const OvertimePage = React.lazy(() => import('pages/overtime'));
const EmailPage = React.lazy(() => import('pages/email'));

export const HRConfig = {
    auth: authRoles.user,
    routes: [
        { path: '/employee', element: <EmployeePage /> },
        { path: '/cleander', element: <CalendarPage /> },
        { path: '/booking', element: <BookingPage /> },
        { path: '/leave', element: <LeavePage /> },
        { path: '/overtime', element: <OvertimePage /> },
        { path: '/email', element: <EmailPage /> }
    ]
};