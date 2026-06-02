import { parseJsxToSchema } from '@/containers/PreviewModal/parseJSXSchema'

const readBalancedObject = (text, startIndex) => {
  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(startIndex, index + 1)
      }
    }
  }

  return ''
}

const readBalancedArray = (text, startIndex) => {
  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      continue
    }

    if (char === '[') depth += 1
    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return text.slice(startIndex, index + 1)
      }
    }
  }

  return ''
}

const collectJsonCandidates = (text = '') => {
  const candidates = [text.trim()]
  const fenceMatches = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)

  for (const match of fenceMatches) {
    candidates.push(match[1].trim())
  }

  let cursor = 0
  while (cursor < text.length) {
    const start = text.indexOf('{', cursor)
    if (start === -1) break

    const candidate = readBalancedObject(text, start)
    if (candidate) {
      candidates.push(candidate)
      cursor = start + candidate.length
    } else {
      cursor = start + 1
    }
  }

  return candidates
}

const unique = (items) => Array.from(new Set(items.filter(Boolean)))

const isFieldLike = (item) => Boolean(
  item &&
  typeof item === 'object' &&
  (item.fieldKey || item.label || item.inputType) &&
  item.inputType
)

const isFieldArray = (items) => Array.isArray(items) && items.some(isFieldLike)

const findFieldArrayInText = (text = '') => {
  let cursor = 0

  while (cursor < text.length) {
    const start = text.indexOf('[', cursor)
    if (start === -1) break

    const source = readBalancedArray(text, start)
    if (!source) {
      cursor = start + 1
      continue
    }

    const parsed = safeParseConfig(source)
    if (isFieldArray(parsed)) {
      return parsed
    }

    cursor = start + source.length
  }

  return null
}

const collectTextVariants = (text = '') => {
  const trimmed = String(text ?? '').trim()
  const variants = [trimmed]

  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === 'string') {
      variants.push(parsed)
    }
  } catch (_) {}

  if (trimmed.includes('\\n') || trimmed.includes('\\"')) {
    variants.push(trimmed.replace(/\\n/g, '\n').replace(/\\"/g, '"'))
  }

  return unique(variants)
}

const safeParseConfig = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return null

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch (_) {
    try {
      const unescaped = value.replace(/\\"/g, '"').replace(/\\n/g, '\n')
      const parsed = JSON.parse(unescaped)
      return Array.isArray(parsed) ? parsed : null
    } catch (__) {
      return null
    }
  }
}

const normalizePayload = (payload) => {
  const data = payload?.data ?? payload ?? {}
  const code = data.code ?? data.jsx_code ?? data.jsxCode ?? payload?.code ?? payload?.jsx_code ?? ''
  let fields = safeParseConfig(data.config ?? data.fields ?? payload?.config ?? payload?.fields)
  fields = isFieldArray(fields) ? fields : null

  if (!fields && typeof code === 'string' && code.trim()) {
    try {
      fields = parseJsxToSchema(code).fields
    } catch (_) {}
  }

  if (!isFieldArray(fields)) return null

  return {
    event : payload?.event ?? 'template_saved',
    fields,
    code  : typeof code === 'string' ? code : '',
    meta  : data.meta ?? payload?.meta ?? {},
  }
}

const extractCodeBlock = (text = '') => {
  const start = text.indexOf('import React')
  if (start === -1) return ''

  const rest = text.slice(start)
  const exportMatch = rest.match(/export\s+default\s+[A-Za-z_][A-Za-z0-9_]*/)
  if (!exportMatch?.index && exportMatch?.index !== 0) return rest

  return rest.slice(0, exportMatch.index + exportMatch[0].length)
}

const extractLooseTemplate = (text = '') => {
  if (!text.includes('template_saved') && !text.includes('"config"')) {
    return null
  }

  const configKeyIndex = text.indexOf('"config"')
  const configArrayStart = configKeyIndex === -1 ? -1 : text.indexOf('[', configKeyIndex)
  const configSource = configArrayStart === -1 ? '' : readBalancedArray(text, configArrayStart)
  const fields = isFieldArray(safeParseConfig(configSource))
    ? safeParseConfig(configSource)
    : findFieldArrayInText(text)

  const codeKeyIndex = text.indexOf('"code"')
  let code = ''
  if (codeKeyIndex !== -1) {
    const codeValueStart = text.indexOf('"', text.indexOf(':', codeKeyIndex) + 1)
    if (codeValueStart !== -1) {
      let cursor = codeValueStart + 1
      let escaped = false
      while (cursor < text.length) {
        const char = text[cursor]
        if (escaped) {
          escaped = false
        } else if (char === '\\') {
          escaped = true
        } else if (char === '"') {
          break
        }
        cursor += 1
      }
      code = text
        .slice(codeValueStart + 1, cursor)
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
  }

  if (!isFieldArray(fields) && !code) return null

  return {
    event : 'template_saved',
    fields: isFieldArray(fields) ? fields : parseJsxToSchema(code).fields,
    code,
    meta  : {},
  }
}

export function parseTemplateSavedMessage(text = '') {
  const textVariants = collectTextVariants(text)
  const candidates = unique(textVariants.flatMap(collectJsonCandidates))

  for (const variant of textVariants) {
    try {
      const looseTemplate = extractLooseTemplate(variant)
      if (looseTemplate) return looseTemplate
    } catch (_) {}
  }

  for (const candidate of candidates) {
    try {
      const payload = JSON.parse(candidate)
      const hasTemplatePayload =
        payload?.event === 'template_saved' ||
        payload?.data?.config ||
        payload?.data?.code ||
        payload?.config ||
        payload?.fields ||
        payload?.code ||
        payload?.jsx_code

      if (!hasTemplatePayload) {
        continue
      }

      const normalized = normalizePayload(payload)
      if (normalized) return normalized
    } catch (_) {
      /* try next candidate */
    }
  }

  for (const variant of textVariants) {
    const code = extractCodeBlock(variant)
    if (!code) continue

    try {
      return {
        event : 'template_saved',
        fields: parseJsxToSchema(code).fields,
        code,
        meta  : {},
      }
    } catch (_) {}
  }

  return null
}

export default parseTemplateSavedMessage
