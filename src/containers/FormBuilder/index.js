/**
 * FormBuilder/index.js
 *
 * Props:
 *   templateId  {number|null}  — edit mode nếu có, null = create
 *   domain      {string}       — domain mặc định
 *   onSave      {function}     — nhận payload { meta, fields[] }
 *   onCancel    {function}
 *   onPreview   {function}     — (mode: "ui"|"code") => void — App level mở PreviewModal
 *   onOpenAI       {function}  — ({ mode, context }) => void — App level mở AIChatbot
 *   onContextUpdate {function} — (context) => void — silent update context, không mở panel
 *   incomingTemplate {object}  — template AI trả về { fields, code, meta, nonce }
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button, Checkbox, ColorPicker, Dropdown, Input, message, Popconfirm, Popover, Select } from 'antd'
import {
  CloseOutlined,
  EditOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CaretDownOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import PreviewModal from '@/containers/PreviewModal'

import { SUCCESS_CODE } from '@/configs'
import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP }  from '@/utils/fieldTypes'
import { buildJSX } from '@/containers/PreviewModal/buildJSX'
import { DEFAULT_FORM_SUBMIT_BUTTON, normalizeFormSubmitButton } from '@/utils/formSubmitButton'
import FieldTypeList       from './FieldTypeList'
import FieldCanvas, { CANVAS_DROPPABLE_ID } from './FieldCanvas'
import FieldConfigPanel    from './FieldConfigPanel'
import {
  BuilderLayout,
  Toolbar,
  ToolbarLeft,
  ToolbarRight,
  ToolbarTitle,
  ToolbarTitleInput,
  ToolbarDomain,
  BuilderBody,
  DragGhost,
  DragGhostIcon,
  PreviewSplitBtn,
  PreviewMainBtn,
  PreviewChevronBtn,
  AIAgentBtn,
  DisplayModeControl,
  DisplayModeLabel,
} from './index.style'

const DISPLAY_MODE_OPTIONS = [
  { value: 'NORMAL', label: 'Hiển thị bình thường' },
  { value: 'MODAL', label: 'Modal' },
  { value: 'DRAWER', label: 'Drawer' },
]

const SUBMIT_BUTTON_ICON_OPTIONS = [
  { value: 'NONE', label: 'Không dùng icon' },
  { value: 'SAVE', label: 'Lưu' },
  { value: 'CHECK', label: 'Xác nhận' },
  { value: 'SEND', label: 'Gửi' },
  { value: 'EDIT', label: 'Cập nhật' },
]

const SUBMIT_BUTTON_TYPE_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'DEFAULT', label: 'Mặc định' },
  { value: 'DANGER', label: 'Nguy hiểm' },
]

const SubmitButtonConfigControl = ({ value, onChange }) => {
  const config = normalizeFormSubmitButton(value)
  const update = patch => onChange({ ...config, ...patch })

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={(
        <div style={{ width: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Nút submit của form
          </div>
          <Checkbox
            checked={config.visible}
            onChange={event => update({ visible: event.target.checked })}
          >
            Hiển thị nút submit
          </Checkbox>

          <div style={{ marginTop: 12, marginBottom: 4, fontSize: 12, color: '#595959' }}>
            Tên nút
          </div>
          <Input
            value={config.label}
            placeholder="Ví dụ: Lưu kết quả"
            onChange={event => update({ label: event.target.value })}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#595959' }}>Icon</div>
              <Select
                value={config.icon}
                options={SUBMIT_BUTTON_ICON_OPTIONS}
                onChange={icon => update({ icon })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#595959' }}>Loại nút</div>
              <Select
                value={config.type}
                options={SUBMIT_BUTTON_TYPE_OPTIONS}
                onChange={type => update({ type })}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, marginBottom: 4, fontSize: 12, color: '#595959' }}>
            Màu tùy chỉnh
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ColorPicker
              value={config.color || '#1677ff'}
              showText
              onChange={(_, color) => update({ color })}
            />
            {config.color ? (
              <Button type="link" size="small" onClick={() => update({ color: null })}>
                Dùng màu mặc định
              </Button>
            ) : null}
          </div>

          <Checkbox
            checked={config.closeAfterSubmit}
            style={{ marginTop: 12 }}
            onChange={event => update({ closeAfterSubmit: event.target.checked })}
          >
            Đóng sau khi submit thành công
          </Checkbox>
        </div>
      )}
    >
      <Button size="small" icon={<SettingOutlined />}>
        Nút submit
      </Button>
    </Popover>
  )
}

const FieldTypeDragGhost = ({ type }) => {
  const meta = FIELD_TYPE_MAP[type]
  if (!meta) return null
  return (
    <DragGhost>
      <DragGhostIcon>⠿</DragGhostIcon>
      {meta.label}
    </DragGhost>
  )
}


const previewMenuItems = [
  {
    key  : 'ui',
    icon : <PlayCircleOutlined />,
    label: 'Form thực',
  },
  {
    key  : 'code',
    icon : <FileTextOutlined />,
    label: 'JSX code',
  },
]

const PreviewButton = ({ onPreview }) => (
  <PreviewSplitBtn>
    <PreviewMainBtn onClick={() => onPreview('ui')}>
      <PlayCircleOutlined />
      Preview
    </PreviewMainBtn>
    <Dropdown
      menu={{
        items   : previewMenuItems,
        onClick : ({ key }) => onPreview(key),
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <PreviewChevronBtn>
        <CaretDownOutlined />
      </PreviewChevronBtn>
    </Dropdown>
  </PreviewSplitBtn>
)

const flattenFields = (items = []) => items.flatMap(field => [
  field,
  ...flattenFields(Array.isArray(field.children) ? field.children : []),
])

const isHiddenField = (field) => {
  const type = String(field?.inputType ?? field?.type ?? field?.component ?? '').toLowerCase()
  return type === 'hidden' || type === 'formhidden'
}

const getFieldProvenance = (field) => field?._provenance ?? field?.config?.__provenance ?? null

const isAiGeneratedField = (field) => (
  (getFieldProvenance(field)?.createdBySource ?? getFieldProvenance(field)?.source) === 'ai'
)

const isStaleGeneratedUploadCode = (code = '', generatedCode = '') => (
  /forwardRef\(\(\{[\s\S]*submitSignal[\s\S]*useImperativeHandle/.test(code)
  && generatedCode.includes('resolveUploadFilename')
  && generatedCode.includes('thumbUrl')
  && generatedCode.includes('onPreview')
  && generatedCode.includes('accept={accept || undefined}')
  && !(
    code.includes('resolveUploadFilename')
    && code.includes('thumbUrl')
    && code.includes('onPreview')
    && code.includes('accept={accept || undefined}')
  )
)

const FormBuilder = ({
  templateId = null,
  domain     = '',
  onSave,
  onCancel,
  onOpenAI,
  onContextUpdate,
  incomingTemplate,
}) => {

  const [,             setSaving]       = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)
  const [previewOpen,   setPreviewOpen]   = useState(false)
  const [previewMode,   setPreviewMode]   = useState('ui')
  const [jsxCode,       setJsxCode]       = useState('')
  const appliedIncomingRef = useRef(null)

  const templateMeta  = useFormBuilderStore(s => s.templateMeta)
  const fields        = useFormBuilderStore(s => s.fields)
  const importGeneratedTemplate = useFormBuilderStore(s => s.importGeneratedTemplate)
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)
  const addField      = useFormBuilderStore(s => s.addField)
  const moveField     = useFormBuilderStore(s => s.moveField)
  const getParentId   = useFormBuilderStore(s => s.getParentId)
  const getFieldLocation = useFormBuilderStore(s => s.getFieldLocation)
  const toPayload     = useFormBuilderStore(s => s.toPayload)
  const resetBuilder  = useFormBuilderStore(s => s.reset)

  const findFieldById = useCallback((items, targetId) => {
    for (const item of items) {
      if (item._id === targetId) return item
      if (Array.isArray(item.children) && item.children.length > 0) {
        const nested = findFieldById(item.children, targetId)
        if (nested) return nested
      }
    }
    return null
  }, [])


  useEffect(() => {
    if (!incomingTemplate?.nonce || appliedIncomingRef.current === incomingTemplate.nonce) {
      return
    }

    appliedIncomingRef.current = incomingTemplate.nonce
    importGeneratedTemplate({
      meta  : incomingTemplate.meta,
      fields: incomingTemplate.fields,
      provenance: incomingTemplate.provenance ?? {
        source: 'api',
        action: 'loaded',
      },
    })
    const nextSchema = {
      meta  : { ...templateMeta, ...(incomingTemplate.meta ?? {}) },
      fields: incomingTemplate.fields ?? [],
    }
    const generatedFallbackCode = buildJSX(nextSchema).plain
    const nextJsxCode = typeof incomingTemplate.code === 'string' && incomingTemplate.code.trim()
      ? incomingTemplate.code
      : generatedFallbackCode
    setJsxCode(nextJsxCode)
    if (incomingTemplate.openPreview === true) {
      setPreviewMode('code')
      setPreviewOpen(true)
    }
  }, [incomingTemplate, importGeneratedTemplate, templateMeta])


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null)
    if (!over) {
      return
    }

    const activeId = active.id
    const overId   = over.id
    const activeField = typeof activeId === 'string' ? findFieldById(fields, activeId) : null
    const overField = typeof overId === 'string' ? findFieldById(fields, overId) : null
    const hasAiFields = flattenFields(fields).some(isAiGeneratedField)

    if (isAiGeneratedField(activeField) || isAiGeneratedField(overField)) {
      return
    }

    /* Case A: kéo từ sidebar */
    if (typeof activeId === 'string' && activeId.startsWith('type:')) {
      if (hasAiFields) {
        return
      }
      const type = activeId.replace('type:', '')
      if (typeof overId === 'string' && overId.startsWith('block-drop:')) {
        const parentId = overId.replace('block-drop:', '')
        if (!isAiGeneratedField(findFieldById(fields, parentId))) {
          addField(type, undefined, parentId)
        }
        return
      }
      if (overId === CANVAS_DROPPABLE_ID) {
        addField(type)
        return
      }
      if (typeof overId === 'string') {
        const location = getFieldLocation(overId)
        const targetParentId = location?.parentId ?? null
        const atIndex = location?.index
        addField(type, typeof atIndex === 'number' && atIndex !== -1 ? atIndex : undefined, targetParentId)
      }
      return
    }

    /* Case B: move field hiện có */
    if (typeof overId === 'string' && overId.startsWith('block-drop:')) {
      const parentId = overId.replace('block-drop:', '')
      if (!isAiGeneratedField(findFieldById(fields, parentId))) {
        moveField(activeId, null, parentId)
      }
      return
    }

    if (overId === CANVAS_DROPPABLE_ID) {
      moveField(activeId, null, null)
      return
    }

    if (activeId !== overId) {
      moveField(activeId, overId, getParentId(overId))
    }
  }, [addField, moveField, getParentId, getFieldLocation, fields, findFieldById])

  const handleDragCancel = useCallback(() => setActiveDragId(null), [])

  const activeDragType = activeDragId?.startsWith?.('type:')
    ? activeDragId.replace('type:', '')
    : null
  const previewSchema = useMemo(() => ({
    meta: templateMeta,
    fields,
  }), [templateMeta, fields])

  const handleSave = async (previewPayload = null) => {
    if (previewPayload?.syncError) {
      message.error(`Code chưa parse ngược được sang form: ${previewPayload.syncError}`)
      return
    }

    const saveSchema = previewPayload?.schema
      ? {
        meta  : previewPayload.schema.meta ?? templateMeta,
        fields: previewPayload.schema.fields ?? fields,
      }
      : null

    const saveMeta = saveSchema?.meta ?? templateMeta
    const saveFields = saveSchema?.fields ?? fields
    const allFields = flattenFields(saveFields).filter(field => !isHiddenField(field))

    const emptyKey = allFields.find(f => !f.fieldKey)
    if (emptyKey) {
      message.error(`Field "${emptyKey.label || '(chưa có nhãn)'}" chưa có mã field.`)
      return
    }

    const keys   = allFields.map(f => f.fieldKey)
    const hasDup = keys.length !== new Set(keys).size
    if (hasDup) {
      message.error('Có mã field bị trùng trong form. Vui lòng kiểm tra lại.')
      return
    }

    if (!saveMeta.name) {
      message.error('Vui lòng đặt tên cho form.')
      return
    }

    setSaving(true)
    try {
      if (saveSchema) {
        importGeneratedTemplate({
          ...saveSchema,
          provenance: {
            source: 'user',
            action: 'edited',
          },
        })
      }

      const basePayload = saveSchema
        ? useFormBuilderStore.getState().toPayload()
        : toPayload()
      const {
        submitButton: submitButtonConfig,
        ...baseMeta
      } = basePayload.meta ?? {}
      const fallbackJsxCode = buildJSX({
        meta: saveMeta,
        fields: saveFields,
      }).plain
      const saveJsxCode = previewPayload?.jsxCode ?? jsxCode
      const buildMeta = previewPayload?.build?.url
        ? {
          microFrontendUrl: previewPayload.build.url,
          component_id: previewPayload.build.component_id,
        }
        : {}
      const payload = {
        ...basePayload,
        meta: {
          ...baseMeta,
          ...buildMeta,
        },
        displayMode: basePayload.meta?.displayMode ?? 'NORMAL',
        submitButton: normalizeFormSubmitButton(submitButtonConfig),
        jsx_code: saveJsxCode || fallbackJsxCode,
        ...buildMeta,
      }

      if (previewPayload?.jsxCode != null) {
        setJsxCode(previewPayload.jsxCode)
      }

      const response = await onSave?.(payload)
      const ok = response == null || response?.success === true || Number(response?.errorCode) === SUCCESS_CODE
      if (!ok) {
        throw new Error(response?.message || 'Lưu thất bại. Vui lòng thử lại.')
      }
      message.success('Đã lưu form template.')
      return response
    } catch (err) {
      message.error(err?.message || 'Lưu thất bại. Vui lòng thử lại.')
      err.formSaveHandled = true
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleOpenAI = useCallback(() => {
    onOpenAI?.({
      mode   : 'form_builder',
      context: {
        meta  : templateMeta,
        fields,
        templateId: templateMeta?.id
      }
    })
  }, [templateMeta, fields, onOpenAI])

  /* Khi fields thay đổi → silent update context, không mở panel */
  useEffect(() => {
    onContextUpdate?.({ meta: templateMeta, fields })
    /* eslint-disable-next-line */
  }, [fields])

  const handlePreview = useCallback((mode = 'ui') => {
    const generatedJsxCode = buildJSX({
      meta: templateMeta,
      fields,
    }).plain
    setJsxCode(current => {
      if (isStaleGeneratedUploadCode(current, generatedJsxCode)) {
        return generatedJsxCode
      }
      return current?.trim() ? current : generatedJsxCode
    })
    setPreviewMode(mode)
    setPreviewOpen(true)
  }, [templateMeta, fields])

  const handleCancel = useCallback(() => {
    setPreviewOpen(false)
    setPreviewMode('ui')
    setJsxCode('')
    setActiveDragId(null)
    appliedIncomingRef.current = null
    resetBuilder()
    onCancel?.()
  }, [onCancel, resetBuilder])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <BuilderLayout>

        {/* ── Toolbar ── */}
        <Toolbar>

          {/* Left — tên form + domain */}
          <ToolbarLeft>
            <EditOutlined style={{ color: '#8c8c8c' }} />
            <ToolbarTitleInput
              value={templateMeta.name}
              onChange={e => setTemplateMeta({ name: e.target.value })}
              placeholder="Nhập tên form"
              aria-label="Tên form"
            />
            {!templateMeta.name && (
              <ToolbarTitle>Form chưa đặt tên</ToolbarTitle>
            )}
            {templateMeta.domain && (
              <ToolbarDomain>{templateMeta.domain}</ToolbarDomain>
            )}
          </ToolbarLeft>

          {/* Right — CTAs + Save */}
          <ToolbarRight>

            <DisplayModeControl>
              <DisplayModeLabel>Kiểu hiển thị</DisplayModeLabel>
              <Select
                aria-label="Kiểu hiển thị form"
                value={templateMeta.displayMode ?? 'NORMAL'}
                options={DISPLAY_MODE_OPTIONS}
                onChange={displayMode => setTemplateMeta({ displayMode })}
                popupMatchSelectWidth={false}
                style={{ width: 172 }}
              />
            </DisplayModeControl>

            <SubmitButtonConfigControl
              value={templateMeta.submitButton ?? DEFAULT_FORM_SUBMIT_BUTTON}
              onChange={submitButton => setTemplateMeta({ submitButton })}
            />

            {/* Preview split button */}
            <PreviewButton onPreview={handlePreview} />

            {/* AI Agent CTA */}
            <AIAgentBtn onClick={handleOpenAI}>
              <ThunderboltOutlined />
              AI Agent
            </AIAgentBtn>

            {/* Divider ngầm — khoảng cách */}
            <div style={{ width: 1, height: 16, background: '#e8e8e8', margin: '0 4px' }} />

            {/* Hủy */}
            <Popconfirm
              title="Hủy thay đổi?"
              description="Các thay đổi chưa lưu sẽ bị mất."
              onConfirm={handleCancel}
              okText="Hủy thay đổi"
              cancelText="Tiếp tục chỉnh sửa"
              okButtonProps={{ danger: true }}
              disabled={fields.length === 0}
            >
              <Button
                icon={<CloseOutlined />}
                onClick={fields.length === 0 ? handleCancel : undefined}
              >
                Hủy
              </Button>
            </Popconfirm>

          </ToolbarRight>
        </Toolbar>

        {/* ── 3-column body ── */}
        <BuilderBody>
          <FieldTypeList />
          <FieldCanvas />
          <FieldConfigPanel />
        </BuilderBody>

      </BuilderLayout>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragType && <FieldTypeDragGhost type={activeDragType} />}
      </DragOverlay>
      
      {/* ── Preview modal ── */}
      <PreviewModal
        open={previewOpen}
        mode={previewMode}
        schema={previewSchema}
        initialJsxCode={jsxCode}
        onJsxCodeChange={setJsxCode}
        onClose={() => setPreviewOpen(false)}
        onSave={async (payload) => {
          await handleSave(payload)
          setPreviewOpen(false)
        }}
      />
    </DndContext>
  )
}

export default FormBuilder
