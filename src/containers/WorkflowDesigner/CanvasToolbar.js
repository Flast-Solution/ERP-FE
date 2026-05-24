import React from 'react'
import { useReactFlow } from 'reactflow'
import { Button, Divider, Tooltip, Upload } from 'antd'
import {
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import useWorkflowHistory from '@/hooks/useWorkflowHistory'
import useWorkflowExport from '@/hooks/useWorkflowExport'
import { ToolbarWrapper } from './styles'

const CanvasToolbar = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { canUndo, canRedo, undo, redo } = useWorkflowHistory()
  const { downloadJSON, importJSON } = useWorkflowExport()

  const iconBtn = (icon, onClick, tooltip, disabled) => (
    <Tooltip title={tooltip}>
      <Button
        type="text"
        size="small"
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        style={{ width: 30, height: 30 }}
      />
    </Tooltip>
  )

  return (
    <ToolbarWrapper>
      {iconBtn(<UndoOutlined />, undo, 'Undo (Ctrl+Z)', !canUndo)}
      {iconBtn(<RedoOutlined />, redo, 'Redo (Ctrl+Shift+Z)', !canRedo)}

      <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

      {iconBtn(<ZoomOutOutlined />, () => zoomOut(), 'Thu nhỏ')}
      {iconBtn(<ZoomInOutlined />, () => zoomIn(), 'Phóng to')}
      {iconBtn(<FullscreenOutlined />, () => fitView({ padding: 0.3 }), 'Fit view')}

      <Divider type="vertical" style={{ margin: '0 2px', height: 18 }} />

      {iconBtn(<DownloadOutlined />, downloadJSON, 'Export JSON')}

      <Tooltip title="Import JSON">
        <Upload
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => {
            importJSON(file)
            return false
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<UploadOutlined />}
            style={{ width: 30, height: 30 }}
          />
        </Upload>
      </Tooltip>
    </ToolbarWrapper>
  )
}

export default CanvasToolbar
