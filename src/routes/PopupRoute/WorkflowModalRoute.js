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
  {
    path: 'workflow.step.attach-form',
    Component: React.lazy(() => import('@/containers/WorkflowDesigner/ModalAttachForm')),
    modalOptions: { title: '', width: 680 },
  }
]

export default WorkflowModalRoute
