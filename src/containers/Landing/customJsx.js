import { buildMicroFrontend, toComponentName, toComponentSlug } from '@/containers/PreviewModal/buildService'

export const CUSTOM_JSX_TYPE = 'customJsx'
export const LANDING_RUNTIME_VERSION = '1.0.0'

export const CUSTOM_JSX_TEMPLATE = `import React from 'react'

export default function CustomBlock({ props, data, actions, mode, route }) {
  const items = Array.isArray(data.items) ? data.items : []

  return (
    <section style={{ padding: 32 }}>
      <h2>{props.title || 'Custom JSX block'}</h2>
      <p>Block đang chạy ở chế độ: {mode}</p>
      <p>Route hiện tại: {route.pathname}</p>
      {data.$loading && <p>Đang tải dữ liệu...</p>}
      {data.$errors?.items && <p>{data.$errors.items}</p>}
      {items.map((item, index) => <div key={item.id || index}>{String(item.name || item)}</div>)}
      <button type="button" onClick={() => actions.navigate('/san-pham')}>
        Đi tới trang sản phẩm
      </button>
      <button type="button" onClick={() => actions.openOverlay('global-drawer')}>
        Mở drawer
      </button>
    </section>
  )
}
`

// React và Landing Runtime là singleton. Thư viện còn lại được build service
// đóng gói theo artifact; không lấy dependency ngẫu nhiên từ host application.
export const CUSTOM_JSX_ALLOWED_IMPORTS = new Set([
  'react',
  'antd',
  '@ant-design/icons',
  'axios',
  'dayjs',
  'lodash',
  'moment',
])

const IMPORT_RE = /(?:import\s+(?:[\s\S]*?\s+from\s+)?|require\s*\()(['"])([^'"]+)\1\)?/g

export const getCustomJsxDependencies = source => (
  [...String(source || '').matchAll(IMPORT_RE)]
    .map(match => match[2])
    .filter(dependency => !dependency.startsWith('.') && !dependency.startsWith('/') && !dependency.startsWith('@/'))
    .filter((dependency, index, list) => list.indexOf(dependency) === index)
)

export const validateCustomJsxSource = source => {
  const code = String(source || '').trim()
  const errors = []
  if (!code) return ['Chưa có source JSX.']
  if (!/export\s+default\s+/.test(code)) errors.push('JSX phải có export default component.')
  if (/\b(?:eval|Function)\s*\(/.test(code)) errors.push('Không cho phép eval hoặc Function constructor.')
  if (/\b(?:document\.write|localStorage|sessionStorage)\b/.test(code)) {
    errors.push('Custom block không được truy cập storage hoặc document.write trực tiếp.')
  }
  if (/(?:fetch\s*\(|axios\.(?:get|post|put|delete)\s*\()\s*['"]https?:\/\//i.test(code)) {
    errors.push('Không hardcode API trong JSX. Hãy cấu hình API bên ngoài và nhận dữ liệu qua data[key].')
  }

  for (const match of code.matchAll(IMPORT_RE)) {
    const dependency = match[2]
    if (dependency.startsWith('.') || dependency.startsWith('/') || dependency.startsWith('@/')) {
      errors.push(`Không cho phép import file nội bộ: ${dependency}`)
    } else if (!CUSTOM_JSX_ALLOWED_IMPORTS.has(dependency)) {
      errors.push(`Dependency chưa được hỗ trợ: ${dependency}`)
    }
  }
  return [...new Set(errors)]
}

export const createCustomDefinitionId = name => {
  const slug = toComponentSlug(name || 'custom-block').replace(/_/g, '-')
  const suffix = (typeof window !== 'undefined' && window.crypto?.randomUUID?.())
    ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `custom.${slug}.${suffix}`
}

export const compileCustomJsx = async ({ name, source, sessionId, definitionId }) => {
  const errors = validateCustomJsxSource(source)
  if (errors.length) throw new Error(errors[0])

  const stableId = definitionId || createCustomDefinitionId(name)
  const componentId = toComponentSlug(stableId)
  const entryFilename = `${toComponentName(name || componentId)}.jsx`
  const result = await buildMicroFrontend({
    sessionId,
    componentId,
    entryFilename,
    jsxCode: source,
  })

  return {
    definitionId: stableId,
    version: new Date().toISOString(),
    runtimeVersion: LANDING_RUNTIME_VERSION,
    componentId: result.component_id || componentId,
    entryUrl: result.url,
    exposedModule: 'MPage',
    entryFilename,
    dependencies: getCustomJsxDependencies(source),
  }
}
