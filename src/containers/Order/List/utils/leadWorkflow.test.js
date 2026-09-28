import { getLeadForwardOptions, hideLeadCreationSummary } from './leadWorkflow'

const steps = [
  { stepCode: 'qualify', buttons: [{ type: 'OPEN_HIDDEN_STEP', targetStepCode: 'nurture' }] },
  { stepCode: 'contact' },
  { stepCode: 'win' },
  { stepCode: 'nurture', hidden: true },
  { stepCode: 'lost' },
]
const options = steps.map(step => ({ value: step.stepCode }))
const buttons = [{ targetStepCode: 'lost', style: 'DANGER' }]

test('save offers only allowed forward main steps, excluding side branches and previous steps', () => {
  expect(getLeadForwardOptions({ steps, currentStep: steps[1], options, buttons }))
    .toEqual([{ value: 'win' }])
  expect(getLeadForwardOptions({ steps, currentStep: steps[2], options, buttons })).toEqual([])
  expect(getLeadForwardOptions({ steps, currentStep: steps[0], options: [], buttons })).toEqual([])
})

test('keeps multiple forward choices instead of silently choosing one', () => {
  expect(getLeadForwardOptions({ steps, currentStep: steps[0], options, buttons }))
    .toEqual([{ value: 'contact' }, { value: 'win' }])
})

test('hides only the remote creation summary and preserves the editable form', () => {
  const container = document.createElement('div')
  container.innerHTML = '<form><section><strong>Đã có từ lúc tạo lead — không hỏi lại</strong><ul><li>Số lượng dự kiến: Chưa có</li><li>Giá trị dự kiến: Chưa có</li><li>Thời gian mua dự kiến: Chưa có</li></ul></section><input name="notes" /></form>'
  hideLeadCreationSummary(container)
  expect(container.querySelector('section').dataset.leadCreationSummary).toBe('true')
  expect(container.querySelector('form').dataset.leadCreationSummary).toBeUndefined()
})

test('never hides a summary wrapper containing editable fields', () => {
  const container = document.createElement('div')
  container.innerHTML = '<section><strong>Đã có từ lúc tạo lead — không hỏi lại</strong><input /><p>Số lượng dự kiến Giá trị dự kiến Thời gian mua dự kiến</p></section>'
  hideLeadCreationSummary(container)
  expect(container.querySelector('[data-lead-creation-summary]')).toBeNull()
})
