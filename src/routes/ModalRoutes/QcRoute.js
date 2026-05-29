import React from 'react';

const QcRoute = [
    {
        path: 'qc.criteria.edit',
        Component: React.lazy(() => import('@/containers/Qc/CriteriaForm')),
        modalOptions: { title: 'Tieu chi QC', width: 800 }
    },
    {
        path: 'qc.checklist.edit',
        Component: React.lazy(() => import('@/containers/Qc/ChecklistForm')),
        modalOptions: { title: 'Bo tieu chi QC', width: 800 }
    },
    {
        path: 'qc.criteria.error',
        Component: React.lazy(() => import('@/containers/Qc/AddFormListError')),
        modalOptions: { title: 'Them loi bo tieu chi', width: 600 }
    },
    {
        path: 'qc.defect.edit',
        Component: React.lazy(() => import('@/containers/Qc/DefectForm')),
        modalOptions: { title: 'Loi QC', width: 700 }
    },
    {
        path: 'qc.inspection.batch',
        Component: React.lazy(() => import('@/containers/Qc/QcInspectionBatchForm')),
        modalOptions: { title: 'Tao moi Lo hang', width: 700 }
    }
];

export default QcRoute;
