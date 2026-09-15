import React from 'react'

const BusinessUnitRouter = [
  {
    path: 'businessUnit.edit',
    permission: 'system.business_unit.manage',
    Component: React.lazy(() => import('@/containers/BusinessUnit')),
    modalOptions: { title: '', width: 920 },
  },
]

export default BusinessUnitRouter
