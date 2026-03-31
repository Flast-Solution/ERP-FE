import React from 'react';

const QcRoute = [
    {
        path: 'qc.criteria.edit',
        Component: React.lazy(() => import('containers/Qc/CriteriaForm')),
        modalOptions: { title: 'Tiêu chí QC', width: 800 }
    },
    {
        path: 'qc.checklist.edit',
        Component: React.lazy(() => import('containers/Qc/ChecklistForm')),
        modalOptions: { title: 'Bộ tiêu chí QC', width: 800 }
    }
];

export default QcRoute;
