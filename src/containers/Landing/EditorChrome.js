import { useEditorStore } from '@/store/editorStore'
import { Button, Tooltip, Badge } from 'antd'
import { useNavigate } from 'react-router-dom'
import { Bolt, Undo, Redo, Monitor, Phone, Cursor, Gear } from './icons'
import {
  Bar, 
  BarGroup, 
  BarCenter, 
  BarRight,
  Logo, 
  ProjectName, 
  Sep, 
  DeviceToggle, 
  DeviceBtn,
  CfgWrap, 
  CfgCount, 
  Avatar
} from './EditorChrome.style'
import { AgentStatus } from './AgentStatus'
import { IconButton } from './IconButton'

export function EditorChrome() {
  const navigate = useNavigate()

  const device = useEditorStore((s) => s.device)
  const setDevice = useEditorStore((s) => s.setDevice)
  const viewMode = useEditorStore((s) => s.viewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)
  const status = useEditorStore((s) => s.status)
  const publish = useEditorStore((s) => s.publish)
  const saveDraft = useEditorStore((s) => s.saveDraft)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const busy = useEditorStore((s) => s.busy)
  const building = useEditorStore((s) => s.building)
  const historyIndex = useEditorStore((s) => s.historyIndex)
  const historyLength = useEditorStore((s) => s.history.length)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)
  const apiCount = useEditorStore((s) =>
    Object.values(s.apiConfig).reduce((n, a) => n + a.length, 0)
  )

  return (
    <Bar>
      <BarGroup>
        <Button type="text" size="small" onClick={() => navigate('/landing')}>← Danh sách</Button>
        <Logo><Bolt /></Logo>
        <ProjectName>flast.vn</ProjectName>
        <Badge variant="neutral">Trang chủ</Badge>
      </BarGroup>

      <BarCenter>
        <Tooltip title="Hoàn tác (⌘Z)">
          <IconButton
            aria-label="Hoàn tác"
            variant="ghost"
            size="sm"
            disabled={viewMode !== 'edit' || busy || historyIndex <= 0}
            onClick={undo}
          >
            <Undo />
          </IconButton>
        </Tooltip>
        <Tooltip title="Làm lại">
          <IconButton
            aria-label="Làm lại"
            variant="ghost"
            size="sm"
            disabled={viewMode !== 'edit' || busy || historyIndex >= historyLength - 1}
            onClick={redo}
          >
            <Redo />
          </IconButton>
        </Tooltip>
        <Sep />
        <DeviceToggle>
          <DeviceBtn
            className={viewMode === 'edit' ? 'is-on' : ''}
            onClick={() => setViewMode('edit')}
            aria-label="Chỉnh sửa"
            title="Chỉnh sửa"
          >
            <Cursor />
          </DeviceBtn>
          <DeviceBtn
            className={viewMode === 'preview' ? 'is-on' : ''}
            onClick={() => setViewMode('preview')}
            aria-label="Preview"
            title="Preview"
          >
            <Monitor />
          </DeviceBtn>
        </DeviceToggle>
        <Sep />
        <DeviceToggle>
          <DeviceBtn
            className={device === 'desktop' ? 'is-on' : ''}
            onClick={() => setDevice('desktop')}
            aria-label="Desktop"
          >
            <Monitor />
          </DeviceBtn>
          <DeviceBtn
            className={device === 'mobile' ? 'is-on' : ''}
            onClick={() => setDevice('mobile')}
            aria-label="Mobile"
          >
            <Phone />
          </DeviceBtn>
        </DeviceToggle>
        <Sep />
        <Tooltip title="Cấu hình API (⌘K)">
          <CfgWrap>
            <IconButton aria-label="Cấu hình API" variant="ghost" size="sm" disabled={viewMode !== 'edit'} onClick={() => setConfigOpen(true)}>
              <Gear />
            </IconButton>
            {apiCount > 0 && <CfgCount>{apiCount}</CfgCount>}
          </CfgWrap>
        </Tooltip>
      </BarCenter>

      <BarRight>
        <AgentStatus status={status} />
        <Button variant="text" size="small" loading={building} disabled={building} onClick={() => saveDraft()}>Lưu nháp</Button>
        <Button variant="text" size="small" loading={building} disabled={building} onClick={publish}>Xuất bản</Button>
        <Avatar>A</Avatar>
      </BarRight>
    </Bar>
  )
}
