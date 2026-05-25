import React from 'react'

const WorkflowModalRoute = [
  {
    path: 'workflow.step-types.config',
    Component: React.lazy(() => import('@/containers/WorkflowDesigner/ModalStepTypes')),
    modalOptions: {
      title: '',
      width: 750,
    },
  },
]

export default WorkflowModalRoute
