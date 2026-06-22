import { useState } from 'react'
import { Form, Input, Tag, Checkbox, Button, Empty, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { RequestUtils, arrayNotEmpty } from '@flast-erp/core/utils'
import styled from 'styled-components'

const FormItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1.5px solid ${({ $selected }) => ($selected ? '#1677ff' : '#f0f0f0')};
  background: ${({ $selected }) => ($selected ? '#e6f4ff' : '#fff')};
  cursor: pointer;
  transition: all 0.12s;
  margin-bottom: 8px;

  &:hover {
    border-color: #1677ff;
  }
`

const FormItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const FormItemName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
`

const FormItemMeta = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const FieldChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 1px 6px;
  color: #595959;
`

const SelectedBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #389e0d;
`

const INPUT_TYPE_LABEL = {
  text: 'Text', 
  textarea: 'Textarea', 
  number: 'Number',
  decimal: 'Decimal', 
  date: 'Date', 
  datetime: 'Datetime',
  select: 'Select', 
  multi_select: 'Multi-select', 
  radio: 'Radio',
  checkbox: 'Checkbox', 
  file: 'File', 
  image: 'Image',
  richtext: 'Richtext', 
  lookup: 'Lookup'
}

const normalizeTemplateResponse = (res = {}) => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.embedded)) return res.embedded
  if (Array.isArray(res?.data?.embedded)) return res.data.embedded
  if (Array.isArray(res?.data)) return res.data
  return []
}

const normalizeTemplate = (item = {}) => {
  const fields = Array.isArray(item.fields) ? item.fields : []
  const displayName = (item.description ?? '').trim() || item.name || item.title || `Form #${item.id}`

  return {
    ...item,
    id: item.id,
    name: displayName,
    formKey: item.name ?? item.formKey ?? item.key ?? '',
    domain: item.domain ?? '',
    description: item.description ?? '',
    fields,
  }
}

/**
 * Props inject từ modal system:
 *   attachedForms  — danh sách form đã gắn vào step hiện tại [{ id, name, required, fields }]
 *   onSave         — (selectedForms) => void
 */
const ModalAttachForm = ({ attachedForms = [], onSave }) => {

  const [searchForm] = Form.useForm()
  const [filter, setFilter] = useState({})

  /* selected: Map<id, { ...FormTemplate, required: bool }> */
  const [selected, setSelected] = useState(() => {
    const map = new Map()
    attachedForms.forEach((f) => map.set(f.id, f))
    return map
  })

  const handleSearch = (values) => {
    setFilter({
      ...(values.name ? { name: values.name } : {}),
      ...(values.domain ? { domain: values.domain } : {}),
    })
  }

  const toggleSelect = (template) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(template.id)) {
        next.delete(template.id)
      } else {
        next.set(template.id, { ...template, required: false })
      }
      return next
    })
  }

  const toggleRequired = (id, e) => {
    e.stopPropagation()
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(id)) {
        next.set(id, { ...next.get(id), required: !next.get(id).required })
      }
      return next
    })
  }

  const handleSave = () => {
    const selectedForms = Array.from(selected.values())
    console.log('[WorkflowDesigner][ModalAttachForm] selected forms', selectedForms)
    onSave(selectedForms)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Search form ── */}
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }}
      >
        <Form.Item name="name" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Tên form..."
            allowClear
          />
        </Form.Item>
        <Form.Item name="domain" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
          <Input placeholder="Domain..." allowClear />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit">Lọc</Button>
        </Form.Item>
      </Form>

      {/* ── Selected summary ── */}
      {arrayNotEmpty(selected) && (
        <SelectedBar>
          <span>Đã chọn <strong>{selected.size}</strong> form</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from(selected.values()).map((f) => (
              <Tag
                key={f.id}
                closable
                onClose={() => toggleSelect(f)}
                style={{ fontSize: 11 }}
              >
                {f.name}
              </Tag>
            ))}
          </div>
        </SelectedBar>
      )}

      {/* Danh sách form */}
      <FormListRenderer
        filter={filter}
        selected={selected}
        onToggle={toggleSelect}
        onToggleRequired={toggleRequired}
      />

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
        <Button
          type="primary"
          disabled={selected.size === 0}
          onClick={handleSave}
          style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }}
        >
          Gắn {selected.size > 0 ? `${selected.size} form` : ''}
        </Button>
      </div>
    </div>
  )
};

const FormListRenderer = ({ filter, selected, onToggle, onToggleRequired }) => {

  const [ data, setData ] = useState([])
  const [ loading, setLoading ] = useState(false)

  useEffect(() => {
    setLoading(true)
    RequestUtils.Get('/workflow/forms/template/filter?isFull=true', filter)
      .then((res) => {
        setData(normalizeTemplateResponse(res).map(normalizeTemplate))
      })
      .catch((err) => {
        console.error('[ModalAttachForm] fetch templates', err)
        setData([])
      })
      .finally(() => setLoading(false))
  }, [filter])

  if (loading) return <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
  if (!data.length) return <Empty description="Không có form nào" style={{ margin: '20px 0' }} />

  return (
    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
      {data.map((template) => {
        const isSelected = selected.has(template.id)
        const selectedItem = selected.get(template.id)
        const fieldCount = template.fields?.length ?? 0

        return (
          <FormItem
            key={template.id}
            $selected={isSelected}
            onClick={() => onToggle(template)}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => onToggle(template)}
              onClick={(e) => e.stopPropagation()}
            />

            <FormItemInfo>
              <FormItemName>{template.name}</FormItemName>
              <FormItemMeta>
                {template.domain && <Tag style={{ fontSize: 10, margin: 0 }}>{template.domain}</Tag>}
                <span>{fieldCount} fields</span>
                {template.description && <span>· {template.description}</span>}
              </FormItemMeta>

              {/* Preview fields */}
              {fieldCount > 0 && (
                <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(template.fields ?? []).slice(0, 6).map((f) => (
                    <FieldChip key={f.id}>
                      {f.label}
                      <span style={{ color: '#bfbfbf' }}>
                        {INPUT_TYPE_LABEL[f.inputType] ?? f.inputType}
                      </span>
                    </FieldChip>
                  ))}
                  {fieldCount > 6 && (
                    <FieldChip style={{ color: '#1677ff' }}>+{fieldCount - 6}</FieldChip>
                  )}
                </div>
              )}
            </FormItemInfo>

            {/* Toggle bắt buộc */}
            {isSelected && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedItem?.required ?? false}
                  onChange={(e) => onToggleRequired(template.id, e)}
                >
                  <span style={{ fontSize: 11, color: '#595959' }}>Bắt buộc</span>
                </Checkbox>
              </div>
            )}
          </FormItem>
        )
      })}
    </div>
  )
};

export default ModalAttachForm;
