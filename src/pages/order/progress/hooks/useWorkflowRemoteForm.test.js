import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RequestUtils } from '@flast-erp/core/utils'
import { useWorkflowRemoteForm } from './useWorkflowRemoteForm'

jest.mock('antd', () => ({ message: { error: jest.fn(), success: jest.fn(), warning: jest.fn() } }))
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: { Post: jest.fn() } }), { virtual: true })
jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true })
jest.mock('../RemoteForm', () => ({ useRemoteForm: () => ({}), hideDuplicatedRemoteFormTitle: jest.fn() }))
jest.mock('../workflowHelpers', () => ({
  buildRemoteAlias: () => 'test',
  buildWorkflowSubmissionPayload: () => ({ templateId: 1, processStepId: 2, entityId: 3, instanceId: 4, stepCode: 'qualify' }),
}))

let root
let state
const preview = { processInstance: { currentStepCode: 'qualify' }, submissions: [{ id: 10 }] }
const refreshWorkflow = jest.fn()
const onSubmitSuccess = jest.fn()
function Harness() {
  state = useWorkflowRemoteForm({ refreshWorkflow, onSubmitSuccess })
  return null
}
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true
  jest.clearAllMocks()
  refreshWorkflow.mockResolvedValue(preview)
  root = createRoot(document.createElement('div'))
  await act(async () => { root.render(<Harness />) })
})
afterEach(async () => {
  await act(async () => { root.unmount() })
  delete global.IS_REACT_ACT_ENVIRONMENT
})

test('waits for the transition callback and ignores a duplicate submit while it is pending', async () => {
  const response = { success: true, data: { id: 10 } }
  RequestUtils.Post.mockResolvedValue(response)
  let finishTransition
  onSubmitSuccess.mockImplementation(() => new Promise(resolve => { finishTransition = resolve }))
  let saving
  await act(async () => { saving = state.handleRemoteFormSubmit({}) })
  expect(onSubmitSuccess).toHaveBeenCalledWith(response, preview)
  expect(state.submittingForm).toBe(true)
  await act(async () => { await state.handleRemoteFormSubmit({}) })
  expect(RequestUtils.Post).toHaveBeenCalledTimes(1)
  await act(async () => { finishTransition(); await saving })
  expect(state.submittingForm).toBe(false)
})

test('does not invoke the transition callback when saving fails', async () => {
  RequestUtils.Post.mockResolvedValue({ success: false, errorCode: 500 })
  await act(async () => { await state.handleRemoteFormSubmit({}) })
  expect(refreshWorkflow).not.toHaveBeenCalled()
  expect(onSubmitSuccess).not.toHaveBeenCalled()
  expect(state.submittingForm).toBe(false)
})
