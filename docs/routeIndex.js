
import React, { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import privateRoutes from './PrivateRoutes';
import { Loading } from '@flast-erp/core/components';

function MyRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      {useRoutes(privateRoutes)}
    </Suspense>
  );
}

export default React.memo(MyRoutes);
