const LEGACY_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](?:@\/)?(?:form-flast|components\/form)\/(\w+)['"]\s*;?\s*\n?/g
const DEEP_CORE_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"]@flast-erp\/core\/components\/form\/(\w+)['"]\s*;?\s*\n?/g
const CORE_COMPONENTS_BARREL_RE = /^\s*import\s+\{([^}]+)\}\s+from\s+['"]@flast-erp\/core\/components['"]\s*;?\s*\n?/gm
const ONE_LINE_IMPORT_RE = /^\s*import\s+[^;\n]+;?\s*$/gm

const KNOWN_CORE_FORM_COMPONENTS = [
  'FormInput',
  'FormInputNumber',
  'FormTextArea',
  'FormSelect',
  'FormRadioGroup',
  'FormCheckbox',
  'FormDatePicker',
  'FormJoditEditor',
  'FormSelectAPI',
  'FormAutoComplete',
  'FormHidden',
]

export const BUILD_WAIT_TIMEOUT_MS = 5 * 60 * 1000

export const toComponentName = (name = '') => {
  const words = String(name)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const baseName = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  return baseName || 'FormView'
}

export const toComponentSlug = (name = '') => {
  const slug = String(name || 'form-view')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (!slug) return 'form_view'
  return /^[a-z]/.test(slug) ? slug : `form_${slug}`
}

const collectNamedImports = (set, importList = '') => {
  importList.split(',').forEach(part => {
    const name = part.trim().split(/\s+as\s+/i).pop()?.trim()
    if (name) set.add(name)
  })
}

const insertAfterFirstImport = (code, line) => {
  const match = code.match(/^import\s+[^;]+;?\s*\n/)
  if (!match) return `${line}${code}`
  const index = match.index + match[0].length
  return `${code.slice(0, index)}${line}${code.slice(index)}`
}

const hoistOneLineImports = (code = '') => {
  const imports = []
  const body = String(code).replace(ONE_LINE_IMPORT_RE, match => {
    const line = match.trim().replace(/;$/, '')
    if (line) imports.push(line)
    return ''
  }).replace(/^\n+/, '')

  if (!imports.length) return body
  return `${[...new Set(imports)].join('\n')}\n${body}`
}

export const normalizeBuildJsxCode = (code = '') => {
  let jsx = String(code)
  const components = new Set()

  jsx = jsx.replace(CORE_COMPONENTS_BARREL_RE, (_, names) => {
    collectNamedImports(components, names)
    return ''
  })
  jsx = jsx.replace(LEGACY_FORM_IMPORT_RE, (_, name) => {
    components.add(name)
    return ''
  })
  jsx = jsx.replace(DEEP_CORE_FORM_IMPORT_RE, (_, name) => {
    components.add(name)
    return ''
  })

  KNOWN_CORE_FORM_COMPONENTS.forEach(name => {
    if (new RegExp(`<${name}\\b`).test(jsx)) components.add(name)
  })

  if (components.size > 0) {
    const barrel = `import { ${[...components].sort().join(', ')} } from '@flast-erp/core/components'\n`
    jsx = insertAfterFirstImport(jsx, barrel)
  }

  return jsx
}

const sanitizeFormCheckboxProps = (code = '') => String(code).replace(
  /<FormCheckbox\b[\s\S]*?\/>/g,
  componentCode => componentCode
    .replace(/\s+(?:valueProp|titleProp)=(?:"[^"]*"|'[^']*'|\{[^{}]*\})/g, '')
    .replace(/\s+options=\{(?:[^{}]|\{[^{}]*\})*\}/g, ''),
)

export const prepareJsxForRemoteBuild = (code = '') => {
  let jsx = sanitizeFormCheckboxProps(normalizeBuildJsxCode(code))

  jsx = jsx.replace(/^import\s+FormBlockPreview\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/gm, '')
  jsx = jsx.replace(/^import\s+\{\s*FormBlockPreview\s*,?\s*([^}]*)\}\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/gm, (_, rest) => {
    const names = rest.split(',').map(value => value.trim()).filter(Boolean)
    if (!names.length) return ''
    return `import { ${names.join(', ')} } from '@flast-erp/core/components'\n`
  })

  return hoistOneLineImports(jsx)
}

export const getBuildPreviewUrl = (data = {}) => (
  data?.previewUrl
  ?? data?.preview_url
  ?? data?.url
  ?? data?.data?.url
  ?? data?.data?.previewUrl
  ?? data?.data?.preview_url
  ?? ''
)

const getBuildComponentId = (data = {}, fallback = '') => (
  data?.component_id
  ?? data?.componentId
  ?? data?.data?.component_id
  ?? data?.data?.componentId
  ?? fallback
)

const isGeneratedWorkflowFormCode = (code = '') => (
  /forwardRef\(\(\{[\s\S]*submitSignal[\s\S]*useImperativeHandle/.test(code)
  || /const FormFileUpload =/.test(code)
)

export const shouldPreferGeneratedCode = ({ initialCode = '', generatedCode = '' }) => {
  if (!initialCode?.trim()) return true
  if (!isGeneratedWorkflowFormCode(initialCode)) return false

  const generatedHasNewUploadHelper = generatedCode.includes('resolveUploadFilename')
    && generatedCode.includes('thumbUrl')
    && generatedCode.includes('onPreview')
    && generatedCode.includes('accept={accept || undefined}')
  if (!generatedHasNewUploadHelper) return false

  const initialHasNewUploadHelper = initialCode.includes('resolveUploadFilename')
    && initialCode.includes('thumbUrl')
    && initialCode.includes('onPreview')
    && initialCode.includes('accept={accept || undefined}')

  return !initialHasNewUploadHelper
}

export const buildMicroFrontend = async ({ sessionId, componentId, entryFilename, jsxCode }) => {
  const response = await fetch('https://ai.flast.vn/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      component_id: componentId,
      files: { [entryFilename]: jsxCode },
      entry_filename: entryFilename,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    const detail = data?.data?.detail ?? data?.detail
    throw new Error(detail ?? data?.message ?? data?.error ?? `Build preview failed: ${response.status}`)
  }

  return {
    ...data,
    componentId: getBuildComponentId(data, componentId),
    previewUrl: getBuildPreviewUrl(data),
  }
}
