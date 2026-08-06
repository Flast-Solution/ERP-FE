import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Checkbox, Form, Input, Modal, Select, Space, Typography, Upload, message } from 'antd'
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useEditorStore } from '@/store/editorStore'
import useChatStore from '@/containers/AIChatbot/useChatStore'
import {
  CUSTOM_JSX_ALLOWED_IMPORTS,
  CUSTOM_JSX_TEMPLATE,
  compileCustomJsx,
  createCustomDefinitionId,
  validateCustomJsxSource,
} from './customJsx'

const MAX_SOURCE_SIZE = 256 * 1024
const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const createApiId = () => (
  (typeof window !== 'undefined' && window.crypto?.randomUUID?.())
  ?? `api-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
)

export const CustomJsxModal = () => {
  const [form] = Form.useForm()
  const replaceSelected = Form.useWatch('replaceSelected', form)
  const [building, setBuilding] = useState(false)
  const open = useEditorStore(state => state.customJsxOpen)
  const target = useEditorStore(state => state.customJsxTarget)
  const editingId = useEditorStore(state => state.customJsxEditingId)
  const selected = useEditorStore(state => state.selected)
  const schema = useEditorStore(state => state.draftSchema)
  const addCustomBlock = useEditorStore(state => state.addCustomBlock)
  const replaceBlockWithCustom = useEditorStore(state => state.replaceBlockWithCustom)
  const updateCustomBlock = useEditorStore(state => state.updateCustomBlock)
  const addCustomOverlay = useEditorStore(state => state.addCustomOverlay)
  const updateCustomOverlay = useEditorStore(state => state.updateCustomOverlay)
  const close = useEditorStore(state => state.closeCustomJsx)

  const editingBlock = useMemo(
    () => schema?.sections?.find(section => section.id === editingId),
    [editingId, schema?.sections],
  )
  const selectedBlock = useMemo(
    () => schema?.sections?.find(section => section.id === selected),
    [schema?.sections, selected],
  )
  const editingOverlay = useMemo(
    () => schema?.overlays?.find(overlay => overlay.id === editingId),
    [editingId, schema?.overlays],
  )
  const isEditing = Boolean(editingBlock || editingOverlay)

  useEffect(() => {
    if (!open) return
    // Mở từ danh sách block luôn là thao tác thêm mới. Chỉ nạp cấu hình của
    // block hiện tại khi người dùng đang sửa chính Custom JSX block đó.
    const sourceBlock = editingBlock
    const apiSources = sourceBlock ? (schema?.dataSources?.[sourceBlock.id] ?? []) : []
    form.setFieldsValue({
      name: editingBlock?.props?.name || editingOverlay?.props?.name || (target === 'drawer' ? 'Drawer toàn cục' : 'Custom JSX block'),
      overlayId: target === 'drawer' ? (editingOverlay?.id || 'global-drawer') : undefined,
      source: editingBlock?.props?.source || editingOverlay?.props?.source || CUSTOM_JSX_TEMPLATE,
      replaceSelected: false,
      routePath: sourceBlock?.props?.routePath || '',
      apis: apiSources.map(api => ({
        id: api.id || createApiId(),
        key: api.key || '',
        method: String(api.method || 'GET').toUpperCase(),
        url: api.url || '',
      })),
    })
  }, [editingBlock, editingOverlay, form, open, schema?.dataSources, selectedBlock, target])

  const toggleReplaceSelected = event => {
    const checked = event.target.checked
    if (!checked || !selectedBlock) return
    const apiSources = schema?.dataSources?.[selectedBlock.id] ?? []
    form.setFieldsValue({
      routePath: selectedBlock.props?.routePath || '',
      apis: apiSources.map(api => ({
        id: api.id || createApiId(),
        key: api.key || '',
        method: String(api.method || 'GET').toUpperCase(),
        url: api.url || '',
      })),
    })
  }

  const beforeUpload = file => {
    if (file.size > MAX_SOURCE_SIZE) {
      message.error('File JSX không được vượt quá 256KB.')
      return Upload.LIST_IGNORE
    }
    const reader = new FileReader()
    reader.onload = () => form.setFieldValue('source', String(reader.result || ''))
    reader.onerror = () => message.error('Không đọc được file JSX.')
    reader.readAsText(file)
    return false
  }

  const submit = async values => {
    const errors = validateCustomJsxSource(values.source)
    if (errors.length) {
      message.error(errors[0])
      return
    }
    if (target === 'drawer' && (schema?.overlays ?? []).some(item => item.id === values.overlayId && item.id !== editingOverlay?.id)) {
      message.error(`ID drawer “${values.overlayId}” đã tồn tại.`)
      return
    }

    const apiSources = (values.apis ?? [])
      .map(api => ({
        id: api.id || createApiId(),
        key: String(api.key || '').trim(),
        method: String(api.method || 'GET').toUpperCase(),
        url: String(api.url || '').trim(),
      }))
      .filter(api => api.key || api.url)
    if (apiSources.some(api => !api.key || !api.url)) {
      message.error('Mỗi API phải có đủ key và endpoint.')
      return
    }
    const keys = apiSources.map(api => api.key)
    if (new Set(keys).size !== keys.length) {
      message.error('Key API trong cùng một block không được trùng nhau.')
      return
    }

    setBuilding(true)
    try {
      const definitionId = editingBlock?.definitionId || editingOverlay?.definitionId || createCustomDefinitionId(values.name)
      const artifact = await compileCustomJsx({
        name: values.name,
        source: values.source,
        definitionId,
        sessionId: useChatStore.getState().getSessionId('form_builder'),
      })
      const payload = {
        ...values,
        routePath: String(values.routePath || '').trim(),
        apiSources,
        definitionId,
        artifact,
      }
      if (editingOverlay) updateCustomOverlay(editingOverlay.id, payload)
      else if (target === 'drawer') addCustomOverlay(payload)
      else if (editingBlock) updateCustomBlock(editingBlock.id, payload)
      else if (values.replaceSelected && selectedBlock) replaceBlockWithCustom(selectedBlock.id, payload)
      else addCustomBlock(payload, selected)
      close()
      form.resetFields()
    } catch (error) {
      message.error(error?.message || 'Build JSX thất bại.')
    } finally {
      setBuilding(false)
    }
  }

  return (
    <Modal
      width={860}
      open={open}
      title={editingOverlay ? 'Sửa drawer JSX toàn cục' : target === 'drawer' ? 'Thêm drawer JSX toàn cục' : editingBlock ? 'Sửa Custom JSX block' : 'Thêm Custom JSX block'}
      onCancel={close}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={close}>Hủy</Button>,
        <Button key="build" type="primary" loading={building} onClick={() => form.submit()}>
          Build và {isEditing ? 'cập nhật' : replaceSelected ? 'thay thế block' : 'thêm'}
        </Button>,
      ]}
    >
      <Alert
        showIcon
        type="info"
        message="JSX nhận API qua data[key]. Chuyển trang nội bộ bằng actions.navigate('/duong-dan'), không cần import react-router-dom."
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="name" label="Tên component" rules={[{ required: true, message: 'Nhập tên component.' }]}>
          <Input />
        </Form.Item>
        {target === 'drawer' && (
          <Form.Item
            name="overlayId"
            label="ID drawer dùng trong actions.openDrawer(id)"
            rules={[{ required: true }, { pattern: /^[a-z][a-z0-9-]*$/, message: 'Dùng chữ thường, số và dấu gạch ngang.' }]}
          >
            <Input placeholder="global-drawer" />
          </Form.Item>
        )}
        {target === 'block' && !editingBlock && selectedBlock && (
          <Form.Item name="replaceSelected" valuePropName="checked" initialValue={false}>
            <Checkbox onChange={toggleReplaceSelected}>
              Thay thế block đang chọn: {selectedBlock.props?.name || selectedBlock.type} (giữ nguyên ID và API)
            </Checkbox>
          </Form.Item>
        )}
        {target === 'block' && (
          <>
            <Form.Item
              name="routePath"
              label="Route hiển thị"
              tooltip="Block chỉ hiển thị khi route khớp. Param :category hoặc :id được dùng lại trong endpoint API."
              rules={[{
                validator: (_, value) => !value || value === '*' || String(value).startsWith('/')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Route phải bắt đầu bằng / hoặc dùng * để khớp mọi route.')),
              }]}
            >
              <Input placeholder="Ví dụ: /category/:category hoặc /products/:id" />
            </Form.Item>

            <Form.Item label="API binding" style={{ marginBottom: 8 }}>
              <Typography.Text type="secondary">
                GET tự động trả kết quả vào data[key]. Endpoint có thể chứa param khai báo trong route.
              </Typography.Text>
            </Form.Item>
            <Form.List name="apis">
              {(fields, { add, remove }) => (
                <Space direction="vertical" size={8} style={{ display: 'flex', marginBottom: 18 }}>
                  {fields.map(field => (
                    <Space key={field.key} align="start" style={{ display: 'flex' }}>
                      <Form.Item name={[field.name, 'id']} hidden><Input /></Form.Item>
                      <Form.Item
                        name={[field.name, 'key']}
                        rules={[{ required: true, message: 'Nhập key.' }]}
                        style={{ marginBottom: 0, width: 170 }}
                      >
                        <Input placeholder="Key, ví dụ: products" />
                      </Form.Item>
                      <Form.Item name={[field.name, 'method']} initialValue="GET" style={{ marginBottom: 0, width: 112 }}>
                        <Select options={API_METHODS.map(method => ({ label: method, value: method }))} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'url']}
                        rules={[{ required: true, message: 'Nhập endpoint.' }]}
                        style={{ marginBottom: 0, width: 390 }}
                      >
                        <Input placeholder="https://api.example.com/products/:id" />
                      </Form.Item>
                      <Button danger type="text" icon={<DeleteOutlined />} aria-label="Xóa API" onClick={() => remove(field.name)} />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ id: createApiId(), key: '', method: 'GET', url: '' })}
                  >
                    Thêm API
                  </Button>
                </Space>
              )}
            </Form.List>
          </>
        )}
        <Form.Item label="Source JSX">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload accept=".jsx,.js,text/javascript" maxCount={1} showUploadList={false} beforeUpload={beforeUpload}>
              <Button icon={<UploadOutlined />}>Tải file JSX</Button>
            </Upload>
            <Form.Item name="source" noStyle rules={[{ required: true, message: 'Nhập source JSX.' }]}>
              <Input.TextArea autoSize={{ minRows: 18, maxRows: 30 }} spellCheck={false} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }} />
            </Form.Item>
          </Space>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary">
        Dependency cho phép: {[...CUSTOM_JSX_ALLOWED_IMPORTS].join(', ')}. Không được import file nội bộ của repo.
      </Typography.Text>
    </Modal>
  )
}
