/**************************************************************************/
/*  MainLayout.js                                                         */
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

import React, { useEffect, useMemo } from 'react';
import { useLocation } from "react-router-dom";
import { useStore } from '@flast-erp/core/components';
import InAppNotify from '@/layouts/InAppNotify';
import ContainerLayouts from "@/layouts/ContainerLayout";
import OrderService from '@/services/OrderService';
/* import { useFlastRemote } from '@/hooks/useDynamicRemote'; */

const MainLayout = (props) => {

    const { pathname } = useLocation();
    const { user } = useStore();

    useEffect(() => {
        OrderService.fetchStatus();
        return () => OrderService.empty();
    }, []);

    const menoInAppNotify = useMemo(() => {
        return (<InAppNotify />)
    }, []);

    const memoLayout = useMemo(() => {
        const isLanding = pathname.startsWith('/landing/edit');
        const Layout = ContainerLayouts[isLanding 
            ? 'LandingLayout' 
            : (user?.id ? 'PrivateLayout' : 'GuestLayout')
        ];
        return <Layout {...props} />
    }, [user, props, pathname]);

    /* const MPage = useFlastRemote("component_001", "MPage", "environment-form") */
    return <>
        { /*MPage && <MPage /> */}
        {memoLayout}
        {menoInAppNotify}
    </>
}

export default MainLayout;
