import React from 'react';
import { useLocation } from 'react-router-dom';
import TenantPage from '@/components/TenantPage';
import OrderHelpButton from './OrderHelpButton';

const LocalOrderPage = React.lazy(() => import('./index'));

const OrderListPage = () => {
  const { pathname } = useLocation();
  const isList = pathname.replace(/\/$/, '') === '/sale/order';

  return (
    <div style={{ position: 'relative' }}>
      {isList ? (
        <div style={{ position: 'absolute', top: 0, right: 8, zIndex: 2 }}>
          <OrderHelpButton />
        </div>
      ) : null}
      <TenantPage page="OrderList" local={LocalOrderPage} />
    </div>
  );
};

export default OrderListPage;
