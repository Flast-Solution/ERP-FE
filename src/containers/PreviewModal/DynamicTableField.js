import React from 'react'
import * as DynamicTableUI from 'antd'

// Self-contained factory: also embedded in generated remote forms.
export function createDynamicTableComponents(React, UI) {
  const types = [
    { value: 'text', label: 'Text' }, { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' }, { value: 'date', label: 'Date' },
  ]
  const element = React.createElement
  function DynamicTableControl({ value, onChange, tableConfig = {}, disabled = false }) {
    const [name, setName] = React.useState('')
    const [type, setType] = React.useState('text')
    const rows = Array.isArray(value) ? value : Array.isArray(value?.rows) ? value.rows : []
    const extraColumns = Array.isArray(value?.columns) ? value.columns : []
    const fixed = Array.isArray(tableConfig.columns) ? tableConfig.columns : []
    const columns = [...fixed, ...extraColumns.filter(column => !fixed.some(item => item.key === column.key))]
    const hasErpColumns = fixed.some(column => column.erpExport === true)
    const selectedIndex = Number.isInteger(value?.selectedRowIndex) && value.selectedRowIndex >= 0
      && value.selectedRowIndex < rows.length ? value.selectedRowIndex : null
    const emit = (nextRows, nextColumns = extraColumns, selectedRowIndex = selectedIndex) => onChange?.({
      rows: nextRows, columns: nextColumns, ...(hasErpColumns ? { selectedRowIndex } : {}),
    })
    const updateCell = (index, key, next) => emit(rows.map((row, i) => i === index ? { ...row, [key]: next } : row))
    const renderCell = (column, row, index) => {
      const cell = row[column.key]
      const props = { disabled, style: { width: '100%' }, 'aria-label': `${column.label} dòng ${index + 1}` }
      if (column.type === 'boolean') return element(UI.Checkbox, {
        disabled, checked: cell === true || cell === 'true', 'aria-label': props['aria-label'],
        onChange: event => updateCell(index, column.key, event.target.checked),
      })
      if (column.type === 'number') return element(UI.InputNumber, {
        ...props, value: cell, controls: false, onChange: next => updateCell(index, column.key, next),
      })
      return element(UI.Input, { ...props, type: column.type === 'date' ? 'date' : 'text', value: cell ?? '',
        onChange: event => updateCell(index, column.key, event.target.value) })
    }
    const addColumn = () => {
      const label = name.trim()
      if (!label) return
      if (columns.some(column => column.label.trim().toLowerCase() === label.toLowerCase())) {
        UI.message.warning('Tên cột đã tồn tại')
        return
      }
      let key = `column_${Date.now()}`
      const keys = new Set(columns.map(column => column.key))
      while (keys.has(key)) key += '_'
      emit(rows, [...extraColumns, { key, label, type }])
      setName('')
    }
    const tableColumns = columns.map(column => ({
      title: column.label, key: column.key, width: 180,
      render: (_, row, index) => renderCell(column, row, index),
    }))
    if (!disabled && tableConfig.allowAddRows !== false) tableColumns.push({
      title: '', key: '__actions', width: 80,
      render: (_, row, index) => element(UI.Popconfirm, {
        title: 'Xóa dòng này?', onConfirm: () => emit(rows.filter((_, i) => i !== index), extraColumns,
          selectedIndex === index ? null : selectedIndex > index ? selectedIndex - 1 : selectedIndex),
      }, element(UI.Button, { danger: true, size: 'small', htmlType: 'button' }, 'Xóa')),
    })
    return element('div', null,
      hasErpColumns && element('p', null, 'Chọn một dòng để lấy giá trị cập nhật ERP.'),
      element(UI.Table, { bordered: true, size: 'small', pagination: false,
        rowSelection: hasErpColumns ? { type: 'radio', selectedRowKeys: selectedIndex == null ? [] : [String(selectedIndex)],
          getCheckboxProps: () => ({ disabled }),
          onChange: keys => { if (!disabled) emit(rows, extraColumns, keys.length ? Number(keys[0]) : null) },
        } : undefined,
        rowKey: (_, index) => String(index), columns: tableColumns, dataSource: rows,
        scroll: { x: Math.max(360, columns.length * 180 + 80) },
        locale: { emptyText: 'Chưa có dòng dữ liệu' },
      }),
      !disabled && element(UI.Space, { wrap: true, style: { marginTop: 12 } },
        tableConfig.allowAddRows !== false && element(UI.Button, {
          htmlType: 'button', onClick: () => emit([...rows, {}]),
        }, '+ Thêm dòng'),
        tableConfig.allowAddColumns !== false && element(UI.Input, {
          value: name, placeholder: 'Tên cột mới', style: { width: 220 },
          onChange: event => setName(event.target.value),
          onPressEnter: event => { event.preventDefault(); addColumn() },
        }),
        tableConfig.allowAddColumns !== false && element(UI.Select, {
          value: type, onChange: setType, options: types, style: { width: 120 }, 'aria-label': 'Loại cột mới',
        }),
        tableConfig.allowAddColumns !== false && element(UI.Button, {
          htmlType: 'button', disabled: !name.trim(), onClick: addColumn,
        }, '+ Thêm cột'),
      ),
    )
  }
  function FormDynamicTableField({ name, label, required, tableConfig, disabled }) {
    return element(UI.Form.Item, { name, label, rules: [{ validator: async (_, value) => {
      const rows = Array.isArray(value) ? value : value?.rows ?? []
      if (required && !rows.length) throw new Error('Vui lòng thêm ít nhất một dòng')
      if (rows.length && tableConfig?.columns?.some(column => column.erpExport === true)
        && (!Number.isInteger(value?.selectedRowIndex) || value.selectedRowIndex < 0 || value.selectedRowIndex >= rows.length)) {
        throw new Error('Vui lòng chọn dòng dùng cập nhật ERP')
      }
      const columns = [...(tableConfig?.columns ?? []), ...(value?.columns ?? [])]
      for (let index = 0; index < rows.length; index += 1) {
        for (const column of columns) {
          const cell = rows[index]?.[column.key]
          if (column.required && (cell == null || (typeof cell === 'string' && !cell.trim()))) {
            throw new Error(`Dòng ${index + 1}: nhập ${column.label}`)
          }
        }
      }
    } }] }, element(DynamicTableControl, { tableConfig, disabled }))
  }
  return { DynamicTableControl, FormDynamicTableField }
}

export const { DynamicTableControl, FormDynamicTableField } = createDynamicTableComponents(React, DynamicTableUI)
