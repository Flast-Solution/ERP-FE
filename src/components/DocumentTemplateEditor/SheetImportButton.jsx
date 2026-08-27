import React, { useState } from 'react'
import { Button, message, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getSheetTableIds, importMarkedSpreadsheet } from './sheetImport'

const SheetImportButton = ({ template, disabled = false, onImport }) => {
  const [loading, setLoading] = useState(false)
  const tableIds = getSheetTableIds(template)
  if (!tableIds.length) return null
  const importFile = async file => {
    setLoading(true)
    try {
      const table = await importMarkedSpreadsheet(file)
      onImport?.(tableIds[0], table)
      message.success(`Đã nhập ${table.rows.length} dòng từ sheet ${table.sheetName}`)
    } catch (error) {
      message.error(error.message || 'Không thể đọc dữ liệu Excel')
    } finally {
      setLoading(false)
    }
    return false
  }
  return (
    <Upload accept=".xlsx,.xls,.csv" showUploadList={false} beforeUpload={importFile} disabled={disabled || loading}>
      <Button icon={<UploadOutlined />} loading={loading} disabled={disabled}>Import Excel</Button>
    </Upload>
  )
}

export default SheetImportButton
