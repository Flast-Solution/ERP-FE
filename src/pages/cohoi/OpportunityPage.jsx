import React from 'react';
import { useLocation } from 'react-router-dom';
import TenantPage from '@/components/TenantPage';
import OpportunityHelpButton from './OpportunityHelpButton';

const LocalCohoiPage = React.lazy(() => import('./index'));

const OpportunityPage = () => {
  const { pathname } = useLocation();
  const isList = pathname.replace(/\/$/, '') === '/sale/co-hoi';

  return (
    <div style={{ position: 'relative' }}>
      {isList ? (
        <div style={{ position: 'absolute', top: 0, right: 8, zIndex: 2 }}>
          <OpportunityHelpButton />
        </div>
      ) : null}
      <TenantPage page="Opportunities" local={LocalCohoiPage} />
    </div>
  );
};

export default OpportunityPage;
