import React from 'react'
import { Button, Checkbox, Input, Select, Space, Switch } from 'antd'

const types = ['text', 'number', 'boolean', 'date'].map(value => ({ value, label: value }))
const DynamicTableConfig = ({ config = {}, onChange, disabled }) => {
  const columns = config.columns ?? []
  const update = (index, patch) => onChange({ columns: columns.map((column, i) => i === index ? { ...column, ...patch } : column) })
  return <div style={{ padding: 16 }}>
    <strong>Cấu hình bảng động</strong>
    <p>Cột cố định: mã cột phải duy nhất, gồm chữ, số và dấu gạch dưới.</p>
    {columns.map((column, index) => <div key={index} style={{ marginBottom: 12 }}>
      <Input disabled={disabled} placeholder="Tên cột" value={column.label} onChange={event => update(index, { label: event.target.value })} />
      <Input disabled={disabled} placeholder="Mã cột" value={column.key}
        status={!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column.key) || columns.some((item, i) => i !== index && item.key === column.key) ? 'error' : undefined}
        onChange={event => update(index, { key: event.target.value })} />
      <Space wrap style={{ marginTop: 4 }}>
        <Select disabled={disabled} value={column.type} options={types} onChange={type => update(index, { type })} style={{ width: 105 }} />
        <Checkbox disabled={disabled} checked={column.required} onChange={event => update(index, { required: event.target.checked })}>Bắt buộc</Checkbox>
        <Checkbox disabled={disabled} checked={column.erpExport === true}
          onChange={event => update(index, { erpExport: event.target.checked })}>Dùng cập nhật ERP</Checkbox>
        <Button disabled={disabled} danger onClick={() => onChange({ columns: columns.filter((_, i) => i !== index) })}>Xóa</Button>
      </Space>
    </div>)}
    <Button disabled={disabled} onClick={() => {
      let index = columns.length + 1
      const keys = new Set(columns.map(column => column.key))
      while (keys.has(`column_${index}`)) index += 1
      onChange({ columns: [...columns, { key: `column_${index}`, label: `Cột ${index}`, type: 'text' }] })
    }}>+ Thêm cột cố định</Button>
    <p><Switch disabled={disabled} checked={config.allowAddRows !== false} onChange={allowAddRows => onChange({ allowAddRows })} /> Cho phép thêm/xóa dòng</p>
    <p><Switch disabled={disabled} checked={config.allowAddColumns !== false} onChange={allowAddColumns => onChange({ allowAddColumns })} /> Cho phép thêm cột khi nhập</p>
  </div>
}
export default DynamicTableConfig
