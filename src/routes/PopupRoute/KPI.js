import React from 'react';
const KPI = [
  {
    path: 'kpi.add',
    Component: React.lazy(() => import('containers/Kpi')),
    modalOptions: { title: '', width: 600 }
  }
];

export default KPI;