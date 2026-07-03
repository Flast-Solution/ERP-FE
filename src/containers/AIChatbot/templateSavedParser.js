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

const COMPONENT_TYPE_TO_INPUT = {
  FormHidden: 'hidden',
  FormInput: 'text',
  FormTextArea: 'textarea',
  FormInputNumber: 'number',
  FormDatePicker: 'date',
  FormSelect: 'select',
  FormRadioGroup: 'radio',
  FormCheckbox: 'checkbox',
  FormJoditEditor: 'richtext',
  FormSelectAPI: 'select_api',
  FormAutoComplete: 'autocomplete',
}

const normalizeInputType = (type) => COMPONENT_TYPE_TO_INPUT[type] ?? type

const normalizeField = (field, index = 0) => {
  if (!field || typeof field !== 'object') return null

  const fieldKey = field.fieldKey ?? field.name ?? field.key ?? (typeof field.id === 'string' ? field.id : '')
  const inputType = normalizeInputType(field.inputType ?? field.type)

  if (!fieldKey || !inputType) return null

  return {
    ...field,
    id: typeof field.id === 'number' ? field.id : null,
    fieldKey,
    label: field.label ?? fieldKey,
    inputType,
    isRequired: field.isRequired ?? field.required ?? false,
    isSearchable: field.isSearchable ?? false,
    isIndexed: field.isIndexed ?? true,
    sortOrder: field.sortOrder ?? index,
    enabled: field.enabled ?? true,
    config: field.config ?? {},
    colSpan: field.colSpan ?? 24,
    refDomain: field.refDomain ?? null,
    autoGenerate: field.autoGenerate ?? null,
    fieldRole: field.fieldRole ?? null,
    children: Array.isArray(field.children)
      ? field.children.map(normalizeField).filter(Boolean)
      : undefined,
  }
}

const normalizeFieldArray = (items) => Array.isArray(items)
  ? items.map(normalizeField).filter(Boolean)
  : null

const isFieldLike = (item) => Boolean(
  item &&
  typeof item === 'object' &&
  (item.fieldKey || item.name || item.label || item.inputType || item.type) &&
  (item.inputType || item.type)
)

const isFieldArray = (items) => Array.isArray(items) && items.some(isFieldLike)

const extractFieldsFromConfig = (config) => {
  if (Array.isArray(config)) return normalizeFieldArray(config)
  if (config && typeof config === 'object' && Array.isArray(config.fields)) {
    return normalizeFieldArray(config.fields)
  }
  return null
}

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
  const trimmed = String(text ?? '')
    .replace(/\[ANSWER\]\s*/g, '')
    .trim()
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

const isLikelyJsxCode = (source = '') => {
  const code = source.trim()

  if (!code) return false
  if (!/<[A-Z][A-Za-z0-9]*[\s/>]/.test(code)) return false

  return (
    /from\s+['"](?:react|antd|@flast-erp\/core|@\/form-flast)/.test(code) ||
    /export\s+default\s+[A-Za-z_][A-Za-z0-9_]*/.test(code) ||
    /\b(?:FormInput|FormSelect|RestEditModal|Row|Col)\b/.test(code)
  )
}

const collectJsxCodeCandidates = (text = '') => {
  const candidates = []
  const fenceMatches = String(text ?? '').matchAll(/```([a-zA-Z0-9_-]*)?\s*([\s\S]*?)```/g)

  for (const match of fenceMatches) {
    const language = (match[1] ?? '').toLowerCase()
    const code = (match[2] ?? '').trim()
    const isCodeLanguage = !language || ['jsx', 'tsx', 'js', 'javascript', 'typescript', 'react'].includes(language)

    if (isCodeLanguage && isLikelyJsxCode(code)) {
      candidates.push(code)
    }
  }

  return candidates
}

const safeParseConfig = (value) => {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value
  if (typeof value !== 'string') return null

  try {
    return JSON.parse(value)
  } catch (_) {
    try {
      const unescaped = value.replace(/\\"/g, '"').replace(/\\n/g, '\n')
      return JSON.parse(unescaped)
    } catch (__) {
      return null
    }
  }
}

const normalizePayload = (payload) => {
  const data = payload?.data ?? payload ?? {}
  const code = data.code ?? data.jsx_code ?? data.jsxCode ?? payload?.code ?? payload?.jsx_code ?? ''
  const parsedConfig = safeParseConfig(data.config ?? data.fields ?? payload?.config ?? payload?.fields)
  let fields = extractFieldsFromConfig(parsedConfig)
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
    meta  : data.meta ?? payload?.meta ?? {
      name: parsedConfig?.title,
      description: parsedConfig?.description,
    },
  }
}

const extractCodeBlock = (text = '') => {
  const source = String(text ?? '')
  const starts = [
    source.indexOf('import React'),
    source.search(/import\s+\{[\s\S]*?\}\s+from\s+['"]@flast-erp\/core/),
    source.search(/import\s+\{[\s\S]*?\}\s+from\s+['"]antd['"]/),
    source.search(/const\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*\(/),
  ].filter(index => index >= 0)

  const start = starts.length ? Math.min(...starts) : -1
  if (start === -1) return ''

  const rest = source.slice(start)
  const exportMatch = rest.match(/export\s+default\s+[A-Za-z_][A-Za-z0-9_]*/)
  if (!exportMatch?.index && exportMatch?.index !== 0) {
    return isLikelyJsxCode(rest) ? rest : ''
  }

  return rest.slice(0, exportMatch.index + exportMatch[0].length)
}

const extractComponentName = (code = '') => {
  const explicitExport = code.match(/export\s+default\s+([A-Za-z_][A-Za-z0-9_]*)/)
  if (explicitExport?.[1]) return explicitExport[1]

  const componentDeclaration = code.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=/)
  if (componentDeclaration?.[1]) return componentDeclaration[1]

  return undefined
}

const parseJsxTemplate = (code = '') => {
  if (!isLikelyJsxCode(code)) return null

  const schema = parseJsxToSchema(code, {
    name: extractComponentName(code),
  })

  if (!isFieldArray(schema.fields)) return null

  return {
    event : 'template_saved',
    fields: schema.fields,
    code,
    meta  : schema.meta ?? {},
  }
}

const extractLooseTemplate = (text = '') => {
  if (!text.includes('template_saved') && !text.includes('"config"')) {
    return null
  }

  const configKeyIndex = text.indexOf('"config"')
  const configArrayStart = configKeyIndex === -1 ? -1 : text.indexOf('[', configKeyIndex)
  const configSource = configArrayStart === -1 ? '' : readBalancedArray(text, configArrayStart)
  const parsedConfig = safeParseConfig(configSource)
  const fields = isFieldArray(extractFieldsFromConfig(parsedConfig))
    ? extractFieldsFromConfig(parsedConfig)
    : findFieldArrayInText(text)

  const codeKeyIndex = ['"code"', '"jsx_code"', '"jsxCode"']
    .map(key => text.indexOf(key))
    .filter(index => index !== -1)
    .sort((left, right) => left - right)[0] ?? -1
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

  const jsxCandidates = unique(textVariants.flatMap(collectJsxCodeCandidates))
  for (const code of jsxCandidates) {
    try {
      const jsxTemplate = parseJsxTemplate(code)
      if (jsxTemplate) return jsxTemplate
    } catch (_) {}
  }

  for (const variant of textVariants) {
    const code = extractCodeBlock(variant)
    if (!code) continue

    try {
      const jsxTemplate = parseJsxTemplate(code)
      if (jsxTemplate) return jsxTemplate
    } catch (_) {}
  }

  return null
}

export default parseTemplateSavedMessage
