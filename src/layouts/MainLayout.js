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
