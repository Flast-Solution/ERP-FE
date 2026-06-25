/**
 * PreviewModal/index.js
 *
 * Modal preview — 2 tab:
 *   "ui"   — Form thực dùng @flast-erp components + Row/Col theo colSpan
 *   "code" — JSX syntax-highlighted, nút Copy JSX
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button, Row, Col, Form } from 'antd'
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
} from "@flast-erp/core/components";
import { buildJSX }    from './buildJSX'
import MonacoCodeEditor from './MonacoCodeEditor'
import { parseJsxToSchema } from './parseJSXSchema'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import { createUuidV7 } from '@/utils/uuid'
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

const LEGACY_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](?:@\/)?(?:form-flast|components\/form)\/(\w+)['"]\s*;?\s*\n?/g
const DEEP_CORE_FORM_IMPORT_RE = /import\s+(\w+)\s+from\s+['"]@flast-erp\/core\/components\/form\/(\w+)['"]\s*;?\s*\n?/g
const CORE_COMPONENTS_BARREL_RE = /import\s+\{([^}]+)\}\s+from\s+['"]@flast-erp\/core\/components['"]\s*;?\s*\n?/g

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

  return jsx
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
          labelField={config.labelField ?? 'name'}
        />
      )

    case 'select_api':
      return (
        <FormSelectAPI
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Tìm kiếm...'}
          api={config.api ?? undefined}
          entity={config.entity ?? ''}
          labelField={config.labelField ?? config.titleProp ?? 'name'}
          valueProp={config.valueProp ?? 'id'}
          titleProp={config.titleProp ?? config.labelField ?? 'name'}
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
  const componentIdRef = useRef(null)
  const buildingComponentIdRef = useRef(null)
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
    const handleBuildEvent = (event) => {
      const payload = event.detail ?? {}
      const payloadComponentId = payload.component_id ?? payload.componentId

      if (!payloadComponentId || payloadComponentId !== buildingComponentIdRef.current) {
        return
      }

      const log = payload.log ?? payload.message ?? ''
      const previewUrl = payload.previewUrl ?? payload.preview_url ?? payload.url ?? ''
      const status = payload.status ?? ''

      if (log) {
        setBuildLogs(current => [...current, log])
        setBuildMsg(log)
        setBuildStatus('done')
      }

      if (previewUrl) {
        setPreviewUrl(previewUrl)
      }

      if (status === 'done' || status === 'success' || previewUrl || log) {
        setBuildStatus('done')
        setBuildMsg(log || 'Build thành công')
      } else if (status === 'error' || status === 'failed') {
        setBuildStatus('error')
        setBuildMsg(log || 'Build thất bại')
      } else {
        setBuildStatus('building')
      }
    }

    window.addEventListener('flast-ai-build', handleBuildEvent)
    return () => window.removeEventListener('flast-ai-build', handleBuildEvent)
  }, [])

  const buildPreview = async ({ sessionId, componentId, entryFilename, jsxCode }) => {
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

    if (!response.ok) {
      throw new Error(data?.message ?? data?.error ?? `Build preview failed: ${response.status}`)
    }

    return {
      ...data,
      previewUrl: data?.previewUrl ?? data?.preview_url ?? data?.url ?? '',
    }
  }

  const handleBuild = useCallback(async () => {
    if (!componentIdRef.current) {
      componentIdRef.current = createUuidV7()
    }

    const previewComponentId = componentId ?? templateId ?? componentIdRef.current

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
    try {
      const { previewUrl: url } = await buildPreview({
        sessionId,
        componentId: previewComponentId,
        entryFilename,
        jsxCode: buildJsxCode,
      })
      setPreviewUrl(url)
      if (url) {
        setBuildStatus('done')
        setBuildMsg('Build thành công')
      } else {
        setBuildStatus('building')
        setBuildMsg('Đã gửi yêu cầu build. Đang chờ log...')
      }
    } catch (err) {
      setBuildStatus('error')
      setBuildMsg(err.message)
    }
  }, [sessionId, componentId, templateId, jsxCode, schema])

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
  const prevGeneratedCodeRef = useRef(generatedCode)
  const getSessionId = useChatStore(s => s.getSessionId)
  const formBuilderSessionId = useMemo(() => getSessionId('form_builder'), [getSessionId])
  const fieldKeys = useMemo(() => (liveSchema?.fields ?? []).map(field => field.fieldKey).filter(Boolean), [liveSchema])

  useEffect(() => { setActiveTab(mode) }, [mode])
  useEffect(() => {
    const prevGeneratedCode = prevGeneratedCodeRef.current
    const hasCustomCode = Boolean(initialJsxCode) && initialJsxCode !== prevGeneratedCode

    if (!isDirty) {
      const nextJsxCode = hasCustomCode ? initialJsxCode : generatedCode
      setJsxCode(current => current === nextJsxCode ? current : nextJsxCode)
      setLiveSchema(current => current === schema ? current : schema)
      setSyncError(current => current === '' ? current : '')
    }

    prevGeneratedCodeRef.current = generatedCode
  }, [initialJsxCode, generatedCode, schema, isDirty])

  useEffect(() => {
    if (!isDirty) {
      setLiveSchema(current => current === schema ? current : schema)
      setSyncError(current => current === '' ? current : '')
      return
    }

    try {
      const parsed = parseJsxToSchema(jsxCode, schema.meta)
      setLiveSchema(parsed)
      setSyncError(current => current === '' ? current : '')
    } catch (err) {
      setSyncError(current => current === (err.message || 'Khong parse duoc JSX.')
        ? current
        : (err.message || 'Khong parse duoc JSX.'))
    }
  }, [jsxCode, schema, isDirty])

  useEffect(() => {
    onJsxCodeChange?.(jsxCode)
  }, [jsxCode, onJsxCodeChange])

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
              onClick={() => onSave?.({
                schema: effectiveSchema,
                jsxCode,
                syncError,
                isDirty,
              })}
            >
              Lưu form
            </Button>
          </FooterRight>
        </ModalFooter>

      </ModalWrapper>
    </Scrim>
  )
}

export default PreviewModal
