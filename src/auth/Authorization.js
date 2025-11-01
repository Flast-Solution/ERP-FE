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
import FuseUtils from 'utils/FuseUtils';
import { useStore } from "DataContext";
import { useLocation, useNavigate, matchPath } from "react-router-dom";

const LOGIN_PATH = '/login';
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
        const granted = matched ? FuseUtils.hasPermission(matched.auth, (user?.id || '') !== '') : false;
        setAccessGranted(granted);
        /* eslint-disable-next-line */
    }, [pathname, user]);

    const redirectRoute = useCallback(() => {
        const { pathname, state } = location;
        let redirectUrl = state?.redirectUrl ?? '/sale/report-common';
        if (!user?.id) {
            let strParams = window.location.search.substring(1)
            navigate(LOGIN_PATH, {
                state: { redirectUrl: pathname.concat(strParams ? '?' + strParams : '') }
            });
        } else {
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
