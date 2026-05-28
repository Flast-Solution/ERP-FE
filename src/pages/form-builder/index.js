/**
 * FormBuilder/index.js
 *
 * Entry point của màn hình Form Builder (A5 — Workflow BE doc).
 * Layout 3 cột: [FieldTypeList] | [FieldCanvas] | [FieldConfigPanel]
 *
 * Trách nhiệm của file này:
 *   1. Bọc toàn bộ trong <DndContext> — xử lý onDragStart + onDragEnd
 *   2. Phân biệt 2 loại drag:
 *      a. Kéo từ FieldTypeList (id = "type:xxx") → drop vào canvas → addField()
 *      b. Kéo reorder trong canvas (id = field._id) → reorderFields()
 *   3. Render <DragOverlay> — ghost theo loại drag đang active
 *   4. Toolbar trên cùng: tên form, domain badge, nút Save / Hủy
 *   5. Nhận props: templateId? (edit mode) | onSave | onCancel
 *
 * Props:
 *   templateId {number|null}  — nếu có: load từ API (edit mode), null = create mode
 *   domain     {string}       — domain mặc định (ví dụ: "fastness")
 *   onSave     {function}     — nhận payload { meta, fields[] } khi user bấm Lưu
 *   onCancel   {function}     — bấm Hủy / đóng
 */

import { useState, useEffect, useCallback } from 'react'
import { Button, Spin, message, Popconfirm } from 'antd'
import {
  SaveOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import useFormBuilderStore from '@/store/useFormBuilderStore'
import { FIELD_TYPE_MAP } from '@/utils/fieldTypes'
import FieldTypeList from '@/containers/FormBuilder/FieldTypeList'
import FieldCanvas, { CANVAS_DROPPABLE_ID } from '@/containers/FormBuilder/FieldCanvas'
import FieldConfigPanel from '@/containers/FormBuilder/FieldConfigPanel'
import {
  BuilderLayout,
  Toolbar,
  ToolbarLeft,
  ToolbarCenter,
  ToolbarRight,
  ToolbarTitle,
  ToolbarDomain,
  BuilderBody,
  DragGhost,
  DragGhostIcon,
} from './index.style'
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import useCollapseSidebar from '@flast-erp/core/hooks/useCollapseSidebar';

const TITLE = 'Form Buidler cho nghiệp vụ.';

const FieldTypeDragGhost = ({ type }) => {
  const meta = FIELD_TYPE_MAP[type]
  if (!meta) return null
  return (
    <DragGhost>
      <DragGhostIcon>
        ⠿
      </DragGhostIcon>
      {meta.label}
    </DragGhost>
  )
}


const FormBuilder = ({
  templateId = null,
  domain     = '',
  onSave,
  onCancel,
}) => {
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [activeDragId, setActiveDragId] = useState(null)

  // Store actions
  const templateMeta   = useFormBuilderStore(s => s.templateMeta)
  const fields         = useFormBuilderStore(s => s.fields)
  /* const loadFromApi    = useFormBuilderStore(s => s.loadFromApi) */
  const setTemplateMeta = useFormBuilderStore(s => s.setTemplateMeta)
  const addField       = useFormBuilderStore(s => s.addField)
  const reorderFields  = useFormBuilderStore(s => s.reorderFields)
  const toPayload      = useFormBuilderStore(s => s.toPayload)
  const reset          = useFormBuilderStore(s => s.reset)

  const { toggleCollapse } = useCollapseSidebar();
  
  useEffect(() => {
    toggleCollapse();
    /* eslint-disable-next-line */
  }, []);


  useEffect(() => {
    reset()
    if (templateId) {
      setLoading(true)
      // TODO: thay bằng API call thực tế
      // api.get(`/form-templates/${templateId}`)
      //   .then(res => loadFromApi(res.data))
      //   .finally(() => setLoading(false))
      setLoading(false)
    } else {
      if (domain) {
        setTemplateMeta({ domain })
      }
    }

    return () => reset()
    /* eslint-disable-next-line */
  }, [templateId])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )


  const handleDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id)
  }, [])

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null)
    if (!over) return

    const activeId = active.id
    const overId   = over.id

    // Case A: Kéo từ FieldTypeList vào canvas
    // activeId = "type:number", overId = CANVAS_DROPPABLE_ID hoặc field._id
    if (typeof activeId === 'string' && activeId.startsWith('type:')) {
      const type = activeId.replace('type:', '')
      if (overId === CANVAS_DROPPABLE_ID || fields.some(f => f._id === overId)) {
        if (fields.some(f => f._id === overId)) {
          const atIndex = fields.findIndex(f => f._id === overId)
          addField(type, atIndex)
        } else {
          addField(type)
        }
      }
      return
    }

    // Case B: Reorder trong canvas
    // activeId = field._id, overId = field._id khác
    if (activeId !== overId) {
      const oldIndex = fields.findIndex(f => f._id === activeId)
      const newIndex = fields.findIndex(f => f._id === overId)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(fields, oldIndex, newIndex).map(f => f._id)
        reorderFields(newOrder)
      }
    }
  }, [fields, addField, reorderFields])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  const activeDragType = activeDragId?.startsWith?.('type:')
    ? activeDragId.replace('type:', '')
    : null

  const handleSave = async () => {
    const emptyKey = fields.find(f => !f.fieldKey)
    if (emptyKey) {
      message.error(`Field "${emptyKey.label || '(chưa có nhãn)'}" chưa có mã field.`)
      return
    }

    const keys = fields.map(f => f.fieldKey)
    const hasDup = keys.length !== new Set(keys).size
    if (hasDup) {
      message.error('Có mã field bị trùng trong form. Vui lòng kiểm tra lại.')
      return
    }

    if (!templateMeta.name) {
      message.error('Vui lòng đặt tên cho form.')
      return
    }

    setSaving(true)
    try {
      const payload = toPayload()
      await onSave?.(payload)
      message.success('Đã lưu form template.')
    } catch (err) {
      message.error('Lưu thất bại. Vui lòng thử lại.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <BuilderLayout style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </BuilderLayout>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: TITLE }]}
      />
      <BuilderLayout>

        {/* ── Toolbar ── */}
        <Toolbar>
          <ToolbarLeft>
            <EditOutlined style={{ color: '#8c8c8c' }} />
            <ToolbarTitle>
              {templateMeta.name || 'Form chưa đặt tên'}
            </ToolbarTitle>
            {templateMeta.domain && (
              <ToolbarDomain>{templateMeta.domain}</ToolbarDomain>
            )}
          </ToolbarLeft>

          <ToolbarCenter>
            {/* Placeholder: có thể thêm breadcrumb hoặc step indicator sau */}
          </ToolbarCenter>

          <ToolbarRight>
            <Popconfirm
              title="Hủy thay đổi?"
              description="Các thay đổi chưa lưu sẽ bị mất."
              onConfirm={onCancel}
              okText="Hủy thay đổi"
              cancelText="Tiếp tục chỉnh sửa"
              okButtonProps={{ danger: true }}
              disabled={fields.length === 0}
            >
              <Button
                icon={<CloseOutlined />}
                onClick={fields.length === 0 ? onCancel : undefined}
              >
                Hủy
              </Button>
            </Popconfirm>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              {templateId ? 'Cập nhật' : 'Lưu form'}
            </Button>
          </ToolbarRight>
        </Toolbar>

        {/* ── 3-column body ── */}
        <BuilderBody>
          <FieldTypeList />
          <FieldCanvas />
          <FieldConfigPanel />
        </BuilderBody>

      </BuilderLayout>

      {/* ── Drag overlay — ghost khi đang kéo từ sidebar ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragType
          ? <FieldTypeDragGhost type={activeDragType} />
          : null
        }
      </DragOverlay>
    </DndContext>
  )
}

export default FormBuilder