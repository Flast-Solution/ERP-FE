const FORBIDDEN_PATH_PARTS = new Set(['__proto__', 'prototype', 'constructor'])
const ALLOWED_ROOTS = new Set(['sections', 'theme'])
const ALLOWED_OPERATIONS = new Set(['add', 'replace', 'remove'])

const decodePathPart = value => value.replace(/~1/g, '/').replace(/~0/g, '~')

const parsePath = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new Error('AI trả về đường dẫn patch không hợp lệ.')
  }

  const parts = path
    .split('/')
    .slice(1)
    .map(decodePathPart)

  if (!parts.length || !ALLOWED_ROOTS.has(parts[0])) {
    throw new Error(`AI không được phép sửa đường dẫn "${path}".`)
  }
  if (parts.some(part => FORBIDDEN_PATH_PARTS.has(part))) {
    throw new Error('Patch chứa đường dẫn không an toàn.')
  }

  return parts
}

const getContainer = (target, parts) => {
  let current = target
  for (const part of parts.slice(0, -1)) {
    if (current == null || typeof current !== 'object') {
      throw new Error(`Không tìm thấy đường dẫn "/${parts.join('/')}".`)
    }
    if (Array.isArray(current) && !/^\d+$/.test(part)) {
      current = current.find(item => String(item?.id) === String(part))
    } else {
      current = current[part]
    }
  }
  return {
    container: current,
    key: parts[parts.length - 1],
  }
}

export const applyLandingPatch = (schema, operations = []) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('AI chưa trả về thay đổi nào.')
  }

  const nextSchema = JSON.parse(JSON.stringify(schema))
  operations.forEach((operation) => {
    if (!ALLOWED_OPERATIONS.has(operation?.op)) {
      throw new Error(`Không hỗ trợ thao tác "${operation?.op}".`)
    }

    const parts = parsePath(operation.path)
    const { container, key } = getContainer(nextSchema, parts)
    if (container == null || typeof container !== 'object') {
      throw new Error(`Không thể áp dụng patch tại "${operation.path}".`)
    }

    if (operation.op === 'remove') {
      if (Array.isArray(container)) {
        const index = /^\d+$/.test(key)
          ? Number(key)
          : container.findIndex(item => String(item?.id) === String(key))
        if (index < 0) {
          throw new Error(`Không tìm thấy phần tử "${key}" để xóa.`)
        }
        container.splice(index, 1)
      } else {
        delete container[key]
      }
      return
    }

    if (Array.isArray(container) && operation.op === 'add' && key === '-') {
      container.push(operation.value)
      return
    }

    if (Array.isArray(container) && !/^\d+$/.test(key)) {
      const index = container.findIndex(item => String(item?.id) === String(key))
      if (index < 0) {
        throw new Error(`Không tìm thấy phần tử "${key}" để cập nhật.`)
      }
      container[index] = operation.value
    } else {
      container[key] = operation.value
    }
  })

  return nextSchema
}

const extractJsonText = (text = '') => {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  return start >= 0 && end > start ? text.slice(start, end + 1) : text.trim()
}

export const parseLandingAiResponse = (text) => {
  let payload
  try {
    payload = JSON.parse(extractJsonText(text))
  } catch {
    throw new Error('AI không trả về đúng định dạng JSON Patch.')
  }

  const operations = payload?.operations ?? payload?.patch
  if (!Array.isArray(operations)) {
    throw new Error('Phản hồi AI thiếu danh sách operations.')
  }

  return {
    operations,
    summary: payload?.summary || 'Đã áp dụng thay đổi từ AI.',
  }
}

export const buildLandingAiContext = ({
  schema,
  selectedElementId,
  attachments = [],
}) => JSON.stringify({
  role: 'landing_page_editor',
  instructions: [
    'Chỉ trả về một JSON object, không giải thích ngoài JSON.',
    'JSON bắt buộc có dạng {"summary":"...","operations":[{"op":"replace","path":"...","value":...}]}.',
    'Chỉ dùng các op add, replace, remove.',
    'Chỉ sửa trong /sections hoặc /theme.',
    'Ưu tiên chỉ sửa section có id selectedElementId.',
    'Có thể tham chiếu section bằng id, ví dụ /sections/hero/props/title.',
    'Không trả về JSX, HTML hoặc markdown.',
  ],
  selectedElementId,
  attachments: attachments.map(file => ({ name: file.name })),
  pageSchema: schema,
})
