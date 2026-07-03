import React from 'react'

const BusinessUnitRouter = [
  {
    path: 'businessUnit.edit',
    Component: React.lazy(() => import('@/containers/BusinessUnit')),
    modalOptions: { title: '', width: 920 },
  },
]

export default BusinessUnitRouter
