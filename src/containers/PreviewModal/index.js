/**
 * PreviewModal/index.js
 *
 * Modal preview — 2 tab:
 *   "ui"   — Form thực dùng @flast-erp components + Row/Col theo colSpan
 *   "code" — JSX syntax-highlighted, nút Copy JSX
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button, Row, Col, Form, message } from 'antd'
import {
  PlayCircleOutlined,
  FileTextOutlined,
  DesktopOutlined,
  MobileOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
  HistoryOutlined,
  SaveOutlined,
  DeploymentUnitOutlined,
  LoadingOutlined,
  WarningOutlined,
  FormOutlined,
} from '@ant-design/icons'
import {
  FormInput,
  FormInputNumber,
  FormTextArea,
  FormSelect,
  FormRadioGroup,
  FormCheckbox,
  FormDatePicker,
  FormJoditEditor,
  FormSelectAPI,
  FormAutoComplete,
  FormHidden,
} from "@flast-erp/core/components";
import { buildJSX }    from './buildJSX'
import MonacoCodeEditor from './MonacoCodeEditor'
import { parseJsxToSchema } from './parseJSXSchema'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import {
  Scrim,
  ModalWrapper,
  ModalHeader,
  HeaderText,
  ModalTitle,
  ModalSubtitle,
  TabBar,
  Tab,
  TabBarRight,
  PaneWrapper,
  FormUIPane,
  ViewportControl,
  ViewportBtn,
  FormCard,
  FormCardFooter,
  CodePane,
  CodeSubHead,
  CodePath,
  CodeToolbar,
  CodeEditorWrapper,
  CodeEditorFallback,
  CodeEditorNotice,
  CodeTextarea,
  BuildStatusBar,
  BuildStatusText,
  ModalFooter,
  FooterLeft,
  FooterRight,
} from './index.style'

const toComponentName = (name = '') => {
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

const toComponentSlug = (name = '') => {
  const slug = String(name || 'form-view')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) return 'form-view'
  return /^[a-z]/.test(slug) ? slug : `form-${slug}`
}

const LEGACY_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](?:@\/)?(?:form-flast|components\/form)\/(\w+)['"]\s*;?\s*\n?/g
const DEEP_CORE_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"]@flast-erp\/core\/components\/form\/(\w+)['"]\s*;?\s*\n?/g
const CORE_COMPONENTS_BARREL_RE = /^\s*import\s+\{([^}]+)\}\s+from\s+['"]@flast-erp\/core\/components['"]\s*;?\s*\n?/gm
const ONE_LINE_IMPORT_RE = /^\s*import\s+[^;\n]+;?\s*$/gm
const BUILD_WAIT_TIMEOUT_MS = 5 * 60 * 1000
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
    if (line) {
      imports.push(line)
    }
    return ''
  }).replace(/^\n+/, '')

  if (!imports.length) {
    return body
  }

  return `${[...new Set(imports)].join('\n')}\n${body}`
}

/** Chuẩn hóa import form component về barrel @flast-erp/core/components. */
const normalizeBuildJsxCode = (code = '') => {
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
    if (new RegExp(`<${name}\\b`).test(jsx)) {
      components.add(name)
    }
  })

  if (components.size > 0) {
    const barrel = `import { ${[...components].sort().join(', ')} } from '@flast-erp/core/components'\n`
    jsx = insertAfterFirstImport(jsx, barrel)
  }

  return jsx
}

/** Chuẩn hóa JSX trước khi gửi POST /build. */
const prepareJsxForRemoteBuild = (code = '') => {
  let jsx = normalizeBuildJsxCode(code)

  // FormBlockPreview được sinh inline trong buildJSX, không có trong package
  jsx = jsx.replace(/^import\s+FormBlockPreview\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/gm, '')
  jsx = jsx.replace(/^import\s+\{\s*FormBlockPreview\s*,?\s*([^}]*)\}\s+from\s+['"][^'"]+['"]\s*;?\s*\n?/gm, (_, rest) => {
    const names = rest.split(',').map(s => s.trim()).filter(Boolean)
    if (!names.length) return ''
    return `import { ${names.join(', ')} } from '@flast-erp/core/components'\n`
  })

  return hoistOneLineImports(jsx)
}

const getBuildPreviewUrl = (data = {}) => (
  data?.previewUrl ??
  data?.preview_url ??
  data?.url ??
  data?.data?.url ??
  data?.data?.previewUrl ??
  data?.data?.preview_url ??
  ''
)

const getBuildComponentId = (data = {}, fallback = '') => (
  data?.component_id ??
  data?.componentId ??
  data?.data?.component_id ??
  data?.data?.componentId ??
  fallback
)

const buildMicroFrontend = async ({ sessionId, componentId, entryFilename, jsxCode }) => {
  const response = await fetch('https://ai.flast.vn/build', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      session_id  : sessionId,
      component_id: componentId,
      files       : {
        [entryFilename]: jsxCode,
      },
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


const FieldPreview = ({ field }) => {
  const { inputType, fieldKey, label, isRequired, config: rawConfig, children = [] } = field
  const config = rawConfig ?? {}
  const placeholder = config.placeholder ?? ''
  const required    = isRequired
  const opts        = (config.options ?? []).map(o => ({
    id   : o.id ?? o.value,
    name : o.name ?? o.label ?? o.value ?? o.id,
  }))

  switch (inputType) {
    case 'hidden':
      return <FormHidden name={fieldKey} />

    case 'block': {
      return (
        <div
          style={{
            border: '1px dashed #d9d9d9',
            background: '#fff',
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
            minHeight: children.length > 0 ? undefined : 220,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: children.length > 0 ? 'flex-start' : 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#1f1f1f' }}>
            {label || 'Block'}
          </div>
          {children.length > 0 ? (
            <Row gutter={[16, 0]} style={{ marginTop: 12 }}>
              {children.map(child => (
                <Col key={child._id ?? child.fieldKey} span={child.colSpan ?? 24}>
                  <FieldPreview field={child} />
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: 24 }}>
              <FormOutlined style={{ fontSize: 44, marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: '#8c8c8c' }}>Kéo field vào đây để bắt đầu</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Chọn loại field từ danh sách bên trái</div>
            </div>
          )}
        </div>
      )
    }

    case 'text':
      return (
        <FormInput
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || label}
        />
      )

    case 'textarea':
      return (
        <FormTextArea
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || label}
          rows={3}
        />
      )

    case 'number':
      return (
        <FormInputNumber
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder}
          min={config.min ?? undefined}
          max={config.max ?? undefined}
          precision={0}
          style={{ width: '100%' }}
        />
      )

    case 'decimal':
      return (
        <FormInputNumber
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder}
          min={config.min ?? undefined}
          max={config.max ?? undefined}
          precision={2}
          style={{ width: '100%' }}
        />
      )

    case 'date':
      return (
        <FormDatePicker
          name={fieldKey}
          label={label}
          required={required}
          style={{ width: '100%' }}
        />
      )

    case 'datetime':
      return (
        <FormDatePicker
          name={fieldKey}
          label={label}
          required={required}
          showTime
          style={{ width: '100%' }}
        />
      )

    case 'select':
      return (
        <FormSelect
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Chọn...'}
          resourceData={opts}
        />
      )

    case 'multi_select':
      return (
        <FormSelect
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Chọn nhiều...'}
          resourceData={opts}
          mode="multiple"
        />
      )

    case 'radio':
      return (
        <FormRadioGroup
          name={fieldKey}
          label={label}
          required={required}
          options={config.options ?? []}
        />
      )

    case 'checkbox':
      return (
        <FormCheckbox
          name={fieldKey}
          label={label}
          required={required}
          options={config.options ?? []}
        />
      )

    case 'file':
    case 'image':
      return (
        <FormInput
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || `Kéo ${inputType === 'image' ? 'ảnh' : 'file'} vào đây...`}
        />
      )

    case 'richtext':
      return (
        <FormJoditEditor
          name={fieldKey}
          label={label}
          required={required}
        />
      )

    case 'lookup':
      return (
        <FormSelectAPI
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Tìm kiếm...'}
          entity={config.entity ?? ''}
          titleProp={config.labelField ?? 'name'}
          searchKey={config.labelField ?? 'name'}
        />
      )

    case 'select_api':
      return (
        <FormSelectAPI
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Tìm kiếm...'}
          apiPath={config.api ?? undefined}
          entity={config.entity ?? ''}
          valueProp={config.valueProp ?? 'id'}
          titleProp={config.titleProp ?? config.labelField ?? 'name'}
          searchKey={config.labelField ?? config.titleProp ?? 'name'}
        />
      )

    case 'autocomplete':
      return (
        <FormAutoComplete
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Nhập để tìm...'}
          resourceData={config.options ?? []}
          valueProp={config.valueProp ?? 'value'}
          titleProp={config.titleProp ?? 'label'}
        />
      )

    default:
      return (
        <FormInput
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || label}
        />
      )
  }
}

const FormUITab = ({ schema, viewport }) => {

  const [form] = Form.useForm()
  const { fields = [] } = schema

  return (
    <FormCard $viewport={viewport}>
      <Form form={form} layout="vertical">
        <Row gutter={[16, 0]}>
          {fields.map(field => (
            <Col key={field._id ?? field.fieldKey} span={field.colSpan ?? 24}>
              <FieldPreview field={field} />
            </Col>
          ))}
        </Row>
      </Form>

      <FormCardFooter>
        <Button>Hủy</Button>
        <Button type="primary" icon={<CheckOutlined />}>
          Nộp kết quả
        </Button>
      </FormCardFooter>
    </FormCard>
  )
}

const JSXCodeTab = ({
  schema,
  templateId,
  sessionId,
  componentId,
  jsxCode,
  setJsxCode,
  isEditable,
  setIsEditable,
  isDirty,
  setIsDirty,
  generatedCode,
  fieldKeys,
  syncError,
}) => {

  const [copied,      setCopied]      = useState(false)
  const [buildStatus, setBuildStatus] = useState('idle')
  const [buildMsg,    setBuildMsg]    = useState('')
  const [buildLogs,   setBuildLogs]   = useState([])
  const [previewUrl,  setPreviewUrl]  = useState('')

  const copyTimerRef = useRef(null)
  const buildingComponentIdRef = useRef(null)
  const buildTimeoutRef = useRef(null)
  const componentName = toComponentName(schema.meta?.name)

  const domain       = schema.meta?.domain ?? 'step'
  const templateSlug = schema.meta?.name
    ? schema.meta.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : 'form'
  const filePath = `forms/${templateSlug}_${domain}.jsx`

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsxCode)
    setCopied(true)
    clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1400)
  }, [jsxCode])

  useEffect(() => {
    const clearBuildTimeout = () => {
      clearTimeout(buildTimeoutRef.current)
      buildTimeoutRef.current = null
    }

    const handleBuildEvent = (event) => {
      const payload = event.detail ?? {}
      const payloadComponentId = payload.component_id ?? payload.componentId

      if (!payloadComponentId || payloadComponentId !== buildingComponentIdRef.current) {
        return
      }

      const log = payload.log ?? payload.message ?? ''
      const previewUrl = getBuildPreviewUrl(payload)
      const status = payload.status ?? ''
      const isSuccess = status === 'done' || status === 'success'
      const isFailure = status === 'error' || status === 'failed'

      if (log) {
        setBuildLogs(current => [...current, log])
        setBuildMsg(log)
      }

      if (previewUrl) {
        setPreviewUrl(previewUrl)
      }

      if (isSuccess || previewUrl) {
        clearBuildTimeout()
        setBuildStatus('done')
        setBuildMsg(log || 'Build thành công')
      } else if (isFailure) {
        clearBuildTimeout()
        setBuildStatus('error')
        setBuildMsg(log || 'Build thất bại')
      } else {
        setBuildStatus('building')
        setBuildMsg(log || 'Đang build preview...')
      }
    }

    window.addEventListener('flast-ai-build', handleBuildEvent)
    return () => {
      clearBuildTimeout()
      window.removeEventListener('flast-ai-build', handleBuildEvent)
    }
  }, [])

  const buildPreview = async ({ sessionId, componentId, entryFilename, jsxCode }) => {
    return buildMicroFrontend({ sessionId, componentId, entryFilename, jsxCode })
  }

  const handleBuild = useCallback(async () => {
    const previewComponentId = toComponentSlug(schema?.meta?.name)

    const buildJsxCode = prepareJsxForRemoteBuild(jsxCode)
    const entryFilename = `${toComponentName(schema?.meta?.name)}.jsx`

    const payload = {
      session_id: sessionId,
      component_id: previewComponentId,
      files: {
        [entryFilename]: buildJsxCode,
      },
      entry_filename: entryFilename,
    }

    console.log('[PreviewModal] build preview payload', payload)
    buildingComponentIdRef.current = previewComponentId

    if (!sessionId) {
      setBuildStatus('error')
      setBuildMsg('Thiếu session_id để build preview.')
      return
    }

    setBuildStatus('building')
    setBuildLogs([])
    setPreviewUrl('')
    setBuildMsg('Đang gửi yêu cầu build...')
    clearTimeout(buildTimeoutRef.current)
    buildTimeoutRef.current = setTimeout(() => {
      if (buildingComponentIdRef.current !== previewComponentId) {
        return
      }
      setBuildStatus('error')
      setBuildMsg('Build quá lâu chưa có kết quả. Vui lòng thử lại hoặc kiểm tra log server.')
      buildingComponentIdRef.current = null
    }, BUILD_WAIT_TIMEOUT_MS)
    try {
      const response = await buildPreview({
        sessionId,
        componentId: previewComponentId,
        entryFilename,
        jsxCode: buildJsxCode,
      })
      const url = response.previewUrl
      const status = response.status ?? ''
      setPreviewUrl(url)
      if (url || status === 'done' || status === 'success') {
        clearTimeout(buildTimeoutRef.current)
        buildTimeoutRef.current = null
        setBuildStatus('done')
        setBuildMsg('Build thành công')
      } else {
        setBuildStatus('building')
        setBuildMsg(response.message ?? 'Đã gửi yêu cầu build. Đang chờ server trả preview...')
      }
    } catch (err) {
      clearTimeout(buildTimeoutRef.current)
      buildTimeoutRef.current = null
      setBuildStatus('error')
      setBuildMsg(err.message)
    }
  }, [sessionId, jsxCode, schema])

  const btnStyle = {
    background: 'rgba(255,255,255,0.10)',
    border    : '1px solid rgba(255,255,255,0.18)',
    color     : '#e2e8f0',
    fontSize  : 11,
    height    : 24,
  }

  return (
    <CodePane>
      <CodeSubHead>
        <CodePath>{filePath} · component `{componentName}`</CodePath>
        <CodeToolbar>
          <Button
            size="small"
            onClick={() => setIsEditable(cur => !cur)}
            style={{ ...btnStyle, color: isEditable ? '#86efac' : '#e2e8f0' }}
          >
            {isEditable ? 'Tắt chỉnh sửa' : 'Bật chỉnh sửa'}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setJsxCode(generatedCode)
              setIsDirty(false)
            }}
            disabled={!isDirty}
            style={btnStyle}
          >
            Reset schema
          </Button>
          <Button
            size="small"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{ ...btnStyle, color: copied ? '#86efac' : '#e2e8f0' }}
          >
            {copied ? 'Đã copy' : 'Copy'}
          </Button>
        </CodeToolbar>
      </CodeSubHead>

      <CodeEditorWrapper>
        <MonacoCodeEditor
          value={jsxCode}
          readOnly={!isEditable}
          fieldKeys={fieldKeys}
          onChange={nextValue => {
            setJsxCode(nextValue)
            setIsDirty(nextValue !== generatedCode)
          }}
          fallback={(loadError) => (
            <CodeEditorFallback>
              <CodeEditorNotice>
                Monaco khong tai duoc. Dang fallback ve textarea. {loadError}
              </CodeEditorNotice>
              <CodeTextarea
                value={jsxCode}
                onChange={e => {
                  setJsxCode(e.target.value)
                  setIsDirty(e.target.value !== generatedCode)
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                readOnly={!isEditable}
              />
            </CodeEditorFallback>
          )}
        />
      </CodeEditorWrapper>

      <BuildStatusBar>
        <BuildStatusText $status={buildStatus}>
          {buildStatus === 'building' && <LoadingOutlined spin />}
          {buildStatus === 'error'    && <WarningOutlined />}
          {buildStatus === 'done'     && <CheckOutlined />}
          {buildMsg || (syncError
            ? `Code da duoc luu, nhung chua parse nguoc duoc sang Form thuc: ${syncError}`
            : buildStatus === 'idle'
              ? 'Sua code roi bam Build de xem truoc'
              : ''
          )}
          {buildLogs.length > 0 && buildStatus === 'building'
            ? ` (${buildLogs.length} log)`
            : ''
          }
        </BuildStatusText>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {buildStatus === 'done' && previewUrl && (
            <Button
              size="small"
              style={{ ...btnStyle, color: '#86efac' }}
              onClick={() => window.open(previewUrl, '_blank')}
            >
              Xem preview ↗
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            icon={buildStatus === 'building'
              ? <LoadingOutlined spin />
              : <DeploymentUnitOutlined />
            }
            onClick={handleBuild}
            disabled={buildStatus === 'building' || !jsxCode.trim()}
            style={{ height: 24, fontSize: 11 }}
          >
            Build preview
          </Button>
        </div>
      </BuildStatusBar>
    </CodePane>
  )
}

const PreviewModal = ({
  open,
  mode = 'ui',
  schema,
  initialJsxCode = '',
  onJsxCodeChange,
  onClose,
  onSave,
}) => {

  const [activeTab, setActiveTab] = useState(mode)
  const [viewport,  setViewport]  = useState('desktop')
  const generatedCode = useMemo(() => buildJSX(schema).plain, [schema])
  const [jsxCode, setJsxCode] = useState(initialJsxCode || generatedCode)
  const [isEditable, setIsEditable] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [liveSchema, setLiveSchema] = useState(schema)
  const [syncError, setSyncError] = useState('')
  const [savingAfterBuild, setSavingAfterBuild] = useState(false)
  const prevGeneratedCodeRef = useRef(generatedCode)
  const lastParsedKeyRef = useRef('')
  const lastNotifiedJsxRef = useRef(initialJsxCode || generatedCode)
  const lastSchemaKeyRef = useRef(JSON.stringify(schema ?? {}))
  const getSessionId = useChatStore(s => s.getSessionId)
  const formBuilderSessionId = useMemo(() => getSessionId('form_builder'), [getSessionId])
  const fieldKeys = useMemo(() => (liveSchema?.fields ?? []).map(field => field.fieldKey).filter(Boolean), [liveSchema])

  const handleSaveAfterBuild = async () => {
    const effectiveSchema = liveSchema ?? schema

    if (syncError) {
      message.error(syncError)
      return
    }

    if (!formBuilderSessionId) {
      message.error('Thiếu session_id để build preview.')
      return
    }

    const buildJsxCode = prepareJsxForRemoteBuild(jsxCode)
    const buildComponentId = toComponentSlug(effectiveSchema?.meta?.name)
    const entryFilename = `${toComponentName(effectiveSchema?.meta?.name)}.jsx`

    setSavingAfterBuild(true)
    try {
      const buildResult = await buildMicroFrontend({
        sessionId: formBuilderSessionId,
        componentId: buildComponentId,
        entryFilename,
        jsxCode: buildJsxCode,
      })

      if (!buildResult.previewUrl) {
        message.error('Build thành công nhưng server chưa trả URL micro-frontend.')
        return
      }

      await onSave?.({
        schema: effectiveSchema,
        jsxCode,
        syncError: '',
        isDirty,
        build: {
          componentId: buildResult.componentId ?? buildComponentId,
          url: buildResult.previewUrl,
          entryFilename,
        },
      })
    } catch (error) {
      if (!error?.formSaveHandled) {
        message.error(error.message)
      }
    } finally {
      setSavingAfterBuild(false)
    }
  }

  useEffect(() => { setActiveTab(mode) }, [mode])
  useEffect(() => {
    if (!open) {
      return
    }

    const prevGeneratedCode = prevGeneratedCodeRef.current
    const hasCustomCode = Boolean(initialJsxCode) && initialJsxCode !== prevGeneratedCode
    const nextSchemaKey = JSON.stringify(schema ?? {})

    if (!isDirty) {
      const nextJsxCode = hasCustomCode ? initialJsxCode : generatedCode
      setJsxCode(current => current === nextJsxCode ? current : nextJsxCode)
      if (lastSchemaKeyRef.current !== nextSchemaKey) {
        lastSchemaKeyRef.current = nextSchemaKey
        setLiveSchema(schema)
      }
      setSyncError(current => current === '' ? current : '')
    }

    prevGeneratedCodeRef.current = generatedCode
  }, [open, initialJsxCode, generatedCode, schema, isDirty])

  useEffect(() => {
    if (!open) {
      return
    }

    if (!isDirty) {
      setSyncError(current => current === '' ? current : '')
      return
    }

    try {
      const parseKey = `${jsxCode}::${JSON.stringify(schema?.meta ?? {})}`
      if (lastParsedKeyRef.current === parseKey) {
        return
      }
      lastParsedKeyRef.current = parseKey
      const parsed = parseJsxToSchema(jsxCode, schema.meta)
      setLiveSchema(parsed)
      setSyncError(current => current === '' ? current : '')
    } catch (err) {
      setSyncError(current => current === (err.message || 'Khong parse duoc JSX.')
        ? current
        : (err.message || 'Khong parse duoc JSX.'))
    }
  }, [open, jsxCode, schema, isDirty])

  useEffect(() => {
    if (!open || jsxCode === initialJsxCode) {
      return
    }
    if (lastNotifiedJsxRef.current === jsxCode) {
      return
    }
    lastNotifiedJsxRef.current = jsxCode
    onJsxCodeChange?.(jsxCode)
  }, [open, initialJsxCode, jsxCode, onJsxCodeChange])

  if (!open) return null

  const effectiveSchema = liveSchema ?? schema
  const { meta = {}, fields = [] } = effectiveSchema ?? {}
  const name     = meta.name ?? 'Form'
  const total    = fields.length
  const required = fields.filter(f => f.isRequired).length

  return (
    <Scrim onClick={e => e.target === e.currentTarget && onClose?.()}>
      <ModalWrapper onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <ModalHeader>
          <HeaderText>
            <ModalTitle>Preview · {name}</ModalTitle>
            <ModalSubtitle>
              Xem hình ảnh form khi KTV điền, hoặc lấy JSX để nhúng vào app.
            </ModalSubtitle>
          </HeaderText>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            style={{ color: '#71717a', flexShrink: 0 }}
          />
        </ModalHeader>

        {/* ── Tab bar ── */}
        <TabBar>
          <Tab $active={activeTab === 'ui'} onClick={() => setActiveTab('ui')}>
            <PlayCircleOutlined />
            Form thực
          </Tab>
          <Tab $active={activeTab === 'code'} onClick={() => setActiveTab('code')}>
            <FileTextOutlined />
            JSX code
          </Tab>

          {/* Viewport toggle — chỉ hiện ở tab UI */}
          {activeTab === 'ui' && (
            <ViewportControl style={{ marginLeft: 12 }}>
              <ViewportBtn $active={viewport === 'desktop'} onClick={() => setViewport('desktop')}>
                <DesktopOutlined />
                Desktop
              </ViewportBtn>
              <ViewportBtn $active={viewport === 'mobile'} onClick={() => setViewport('mobile')}>
                <MobileOutlined />
                Mobile
              </ViewportBtn>
            </ViewportControl>
          )}

          <TabBarRight>
            {total} field · {required} bắt buộc
          </TabBarRight>
        </TabBar>

        {/* ── Pane ── */}
        <PaneWrapper>
          {activeTab === 'ui' ? (
            <FormUIPane>
              <FormUITab schema={effectiveSchema} viewport={viewport} />
            </FormUIPane>
          ) : (
            <JSXCodeTab
              schema={effectiveSchema}
              templateId={schema?.meta?.id}
              sessionId={formBuilderSessionId}
              componentId={effectiveSchema?.meta?.id}
              jsxCode={jsxCode}
              setJsxCode={setJsxCode}
              isEditable={isEditable}
              setIsEditable={setIsEditable}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              generatedCode={generatedCode}
              fieldKeys={fieldKeys}
              syncError={syncError}
            />
          )}
        </PaneWrapper>

        {/* ── Footer ── */}
        <ModalFooter>
          <FooterLeft>
            <HistoryOutlined />
            {meta.id
              ? `template_id=${meta.id} · ${meta.domain ?? ''}`
              : 'Chưa lưu'
            }
          </FooterLeft>
          <FooterRight>
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingAfterBuild}
              disabled={savingAfterBuild}
              onClick={handleSaveAfterBuild}
            >
              {savingAfterBuild ? 'Đang build...' : 'Lưu form'}
            </Button>
          </FooterRight>
        </ModalFooter>

      </ModalWrapper>
    </Scrim>
  )
}

export default PreviewModal
