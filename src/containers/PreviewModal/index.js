/**
 * PreviewModal/index.js
 *
 * Modal preview — 2 tab:
 *   "ui"   — Form thực dùng @flast-erp components + Row/Col theo colSpan
 *   "code" — JSX syntax-highlighted, nút Copy JSX
 */

import { useState, useCallback, useRef } from 'react'
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
  CodeBlock,
  ModalFooter,
  FooterLeft,
  FooterRight,
} from './index.style'

// ─── Render từng field dùng @flast-erp components ────────────────────────────

const FieldPreview = ({ field }) => {
  const { inputType, fieldKey, label, isRequired, config = {} } = field
  const placeholder = config.placeholder ?? ''
  const required    = isRequired
  const opts        = (config.options ?? []).map(o => ({
    id   : o.value,
    name : o.label ?? o.value,
  }))

  switch (inputType) {
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

// ─── Form UI pane ─────────────────────────────────────────────────────────────

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

// ─── JSX code pane ────────────────────────────────────────────────────────────

const JSXCodeTab = ({ schema }) => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  const { plain, html } = buildJSX(schema)

  const domain       = schema.meta?.domain ?? 'step'
  const templateSlug = schema.meta?.name
    ? schema.meta.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : 'form'
  const filePath = `forms/${templateSlug}_${domain}.jsx`

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(plain)
    setCopied(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 1400)
  }, [plain])

  return (
    <CodePane>
      <CodeSubHead>
        <CodePath>{filePath}</CodePath>
        <Button
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.10)',
            border    : '1px solid rgba(255,255,255,0.18)',
            color     : copied ? '#86efac' : '#e2e8f0',
            fontSize  : 11,
            height    : 24,
            transition: 'color 0.2s',
          }}
        >
          {copied ? 'Đã copy' : 'Copy JSX'}
        </Button>
      </CodeSubHead>

      <CodeBlock dangerouslySetInnerHTML={{ __html: html }} />
    </CodePane>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const PreviewModal = ({ open, mode = 'ui', schema, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState(mode)
  const [viewport,  setViewport]  = useState('desktop')

  // Sync tab khi prop mode thay đổi
  useState(() => { setActiveTab(mode) }, [mode])

  if (!open) return null

  const { meta = {}, fields = [] } = schema ?? {}
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
              <FormUITab schema={schema} viewport={viewport} />
            </FormUIPane>
          ) : (
            <JSXCodeTab schema={schema} />
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