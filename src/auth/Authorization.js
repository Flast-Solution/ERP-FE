/**************************************************************************/
/*  Authorization.js                                                      */
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

import React, { useCallback, useEffect, useState } from 'react';
import { FuseUtils } from '@flast-erp/core/utils';
import { useStore } from '@flast-erp/core/components';
import { useLocation, useNavigate, matchPath } from "react-router-dom";
import { AUTH_REDIRECT_URL_KEY } from '@/utils/sessionExpiry';

const LOGIN_PATH = '/login';
const PUBLIC_AUTHENTICATED_PREFIXES = [
    '/sale/order/progress',
    '/customer/enterprise'
];
/* const log = (key, value) => console.log('[auth.Authorization] ' + key + ' ', value); */
const Authorization = (props) => {

    const [accessGranted, setAccessGranted] = useState(true);
    let location = useLocation();
    let navigate = useNavigate();

    const { routes, user } = useStore();
    const { pathname } = location;

    useEffect(() => {
        /* const matched = routes.find(r => r.path === pathname); */
        const matched = routes.find(r => r.path && matchPath({ path: r.path, end: true }, pathname));
        const isAuthenticatedPublicPath = PUBLIC_AUTHENTICATED_PREFIXES.some(path => pathname.startsWith(path));
        const granted = matched
            ? FuseUtils.hasPermission(matched.auth, (user?.id || '') !== '')
            : Boolean(user?.id && isAuthenticatedPublicPath);
        setAccessGranted(granted);
        /* eslint-disable-next-line */
    }, [pathname, user]);

    const redirectRoute = useCallback(() => {
        const { pathname, state } = location;
        const storedRedirectUrl = window.sessionStorage.getItem(AUTH_REDIRECT_URL_KEY);
        let redirectUrl = state?.redirectUrl ?? storedRedirectUrl ?? '/sale/report-common';
        if (!user?.id) {
            const requestedUrl = `${pathname}${location.search}${location.hash}`;
            if (pathname !== LOGIN_PATH) {
                window.sessionStorage.setItem(AUTH_REDIRECT_URL_KEY, requestedUrl);
            }
            navigate(LOGIN_PATH, {
                state: { redirectUrl: requestedUrl }
            });
        } else {
            window.sessionStorage.removeItem(AUTH_REDIRECT_URL_KEY);
            navigate(redirectUrl);
        }
    }, [navigate, location, user])

    useEffect(() => {
        if (!accessGranted || (user?.id && pathname === LOGIN_PATH)) {
            redirectRoute();
        }
        /* eslint-disable-next-line */
    }, [accessGranted, redirectRoute]);

    return accessGranted ? <React.Fragment>{props.children}</React.Fragment> : '';
}

export default Authorization;
