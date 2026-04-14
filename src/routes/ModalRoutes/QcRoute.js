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
    },
    {
        path: 'qc.checklist.assign',
        Component: React.lazy(() => import('containers/Qc/ProductChecklistForm')),
        modalOptions: { title: 'Gán bộ tiêu chí QC', width: 600 }
    },
    {
        path: 'qc.criteria.error',
        Component: React.lazy(() => import('containers/Qc/AddFormListError')),
        modalOptions: { title: 'Thêm lỗi bộ tiêu chí', width: 600 }
    }
];

export default QcRoute;
