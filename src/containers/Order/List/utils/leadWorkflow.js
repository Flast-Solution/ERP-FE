// Only advance along an allowed, visible forward transition. Side branches keep
// their explicit buttons and must never become the default save action.
export const getLeadForwardOptions = ({ steps, currentStep, options, buttons }) => {
  const auxiliaryCodes = new Set(steps.flatMap(step => (
    (step.buttons ?? [])
      .filter(button => button.type === 'OPEN_HIDDEN_STEP')
      .map(button => String(button.targetStepCode))
  )))
  const dangerCodes = new Set(buttons
    .filter(button => String(button.style).toUpperCase() === 'DANGER')
    .map(button => String(button.targetStepCode)))
  const currentIndex = steps.findIndex(step => String(step.stepCode) === String(currentStep?.stepCode))
  return options.filter(option => {
    const index = steps.findIndex(step => String(step.stepCode) === String(option.value))
    return currentIndex >= 0 && index > currentIndex
      && !steps[index]?.hidden
      && !auxiliaryCodes.has(String(option.value))
      && !dangerCodes.has(String(option.value))
  })
}

// Hide only the matching informational block, never a surrounding editable form.
const hideLeadInfoBlock = (container, title, labels, attribute) => {
  if (!container) return
  const heading = Array.from(container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span,strong'))
    .find(element => title.test(element.textContent.trim()))
  if (!heading) return
  let block = heading
  while (block && block !== container) {
    if (block.querySelector('input,textarea,select,button,[contenteditable="true"]')) return
    const text = block.textContent
    if (labels.every(label => text.includes(label))) {
      block.dataset[attribute] = 'true'
      return
    }
    block = block.parentElement
  }
}

export const hideLeadCreationSummary = container => hideLeadInfoBlock(
  container,
  /^Đã có từ lúc tạo lead\s*[—–-]\s*không hỏi lại$/i,
  ['Số lượng dự kiến', 'Giá trị dự kiến', 'Thời gian mua dự kiến'],
  'leadCreationSummary',
)

export const hideLeadStageOutcome = container => hideLeadInfoBlock(
  container,
  /^Kết quả chuyển stage$/i,
  ['Đủ điều kiện', 'Chưa đủ, còn tiềm năng', 'Chưa đủ điều kiện'],
  'leadStageOutcome',
)

export const hideLeadFormInstructions = container => {
  if (!container) return
  hideLeadInfoBlock(
    container,
    /^Hệ thống tự tạo$/i,
    ['NURTURE', 'Task follow-up vào ngày dự kiến quay lại', 'Notification cho sales phụ trách'],
    'leadFormInstruction',
  )
  const instructions = new Set([
    'Không cho phép chỉ chọn LOST — bắt buộc phải có lý do mất để phục vụ phân tích nguyên nhân.',
    'Báo giá được tạo ở module khác. Chọn mã cơ hội đã có báo giá để bắt đầu đàm phán — hệ thống tự lấy giá trị hiện tại từ báo giá đó.',
    'Bắt buộc điền form này để chốt đơn. Hệ thống sẽ tạo doanh thu (revenue) và gắn nguồn lead vào báo cáo.',
  ])
  container.querySelectorAll('p,div,span,section,aside').forEach(element => {
    const text = element.textContent.replace(/\s+/g, ' ').trim()
    if (instructions.has(text)
      && !element.querySelector('input,textarea,select,button,[contenteditable="true"]')) {
      element.dataset.leadFormInstruction = 'true'
    }
  })
}
