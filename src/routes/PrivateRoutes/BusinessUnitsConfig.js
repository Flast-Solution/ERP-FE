import React from 'react'
import { authRoles } from '@/auth'

const BusinessUnitsPage = React.lazy(() => import('@/pages/businessUnits'))

export const BusinessUnitsConfig = {
  auth: authRoles.user,
  routes: [
    { path: '/system/business-units', element: <BusinessUnitsPage /> },
  ],
}
