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
import FormInput       from '@/form-flast/FormInput'
import FormInputNumber from '@/form-flast/FormInputNumber'
import FormTextArea    from '@/form-flast/FormTextArea'
import FormSelect      from '@/form-flast/FormSelect'
import FormRadioGroup  from '@/form-flast/FormRadioGroup'
import FormCheckbox    from '@/form-flast/FormCheckbox'
import FormDatePicker  from '@/form-flast/FormDatePicker'
import FormJoditEditor from '@/form-flast/FormJoditEditor'
import FormSelectAPI   from '@/form-flast/FormSelectAPI'
import { buildJSX }    from './buildJSX'
import MonacoCodeEditor from './MonacoCodeEditor'
import { parseJsxToSchema } from './parseJSXSchema'
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


const FieldPreview = ({ field }) => {
  const { inputType, fieldKey, label, isRequired, config = {}, children = [] } = field
  const placeholder = config.placeholder ?? ''
  const required    = isRequired
  const opts        = (config.options ?? []).map(o => ({
    id   : o.value,
    name : o.label ?? o.value,
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
  const [previewUrl,  setPreviewUrl]  = useState('')

  const copyTimerRef = useRef(null)
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

  const buildPreview = async (params) => {
    return { previewUrl: ""}
  }

  const handleBuild = useCallback(async () => {
    if (!templateId) {
      setBuildStatus('error')
      setBuildMsg('Cần lưu form trước khi build preview.')
      return
    }
    setBuildStatus('building')
    setBuildMsg('Đang build...')
    try {
      const { previewUrl: url } = await buildPreview(
        templateId,
        jsxCode,
        ({ status, progress }) => {
          setBuildStatus(status)
          setBuildMsg(progress ?? '')
        }
      )
      setPreviewUrl(url)
      setBuildStatus('done')
      setBuildMsg('Build thành công')
    } catch (err) {
      setBuildStatus('error')
      setBuildMsg(err.message)
    }
  }, [templateId, jsxCode])

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
  const generatedCode = useMemo(() => buildJSX(schema).plain, [schema?.meta, schema?.fields])
  const [jsxCode, setJsxCode] = useState(initialJsxCode || generatedCode)
  const [isEditable, setIsEditable] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [liveSchema, setLiveSchema] = useState(schema)
  const [syncError, setSyncError] = useState('')
  const prevGeneratedCodeRef = useRef(generatedCode)
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
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>
              Lưu form
            </Button>
          </FooterRight>
        </ModalFooter>

      </ModalWrapper>
    </Scrim>
  )
}

export default PreviewModal
