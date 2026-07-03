import React, { Suspense } from 'react';
import { Loading, useStore } from '@flast-erp/core/components';
import { useRoutes } from "react-router-dom";

const LandingLayout = (props) => {
    const { routes } = useStore();
    return (
        <Suspense fallback={<Loading />}>
            {useRoutes(routes)}
            {props.children}
        </Suspense>
    )
};

export default LandingLayout;
