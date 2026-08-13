export const DEFAULT_FORM_SUBMIT_BUTTON = {
  visible: true,
  label: 'Lưu',
  icon: 'SAVE',
  color: null,
  type: 'PRIMARY',
  closeAfterSubmit: false,
}

const parseConfig = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return {}

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch (_) {
    return {}
  }
}

export const normalizeFormSubmitButton = (value) => {
  const config = parseConfig(value)

  return {
    visible: config.visible ?? DEFAULT_FORM_SUBMIT_BUTTON.visible,
    label: config.label ?? DEFAULT_FORM_SUBMIT_BUTTON.label,
    icon: config.icon ?? DEFAULT_FORM_SUBMIT_BUTTON.icon,
    color: config.color ?? null,
    type: config.type ?? DEFAULT_FORM_SUBMIT_BUTTON.type,
    closeAfterSubmit: config.closeAfterSubmit ?? DEFAULT_FORM_SUBMIT_BUTTON.closeAfterSubmit,
  }
}

export const getFormSubmitButtonConfig = (formTemplate = {}) => (
  normalizeFormSubmitButton(formTemplate?.submitButton)
)
