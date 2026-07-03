import { useEditorStore } from '@/store/editorStore'
import { Button, Tooltip, Badge } from 'antd'
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

  const device = useEditorStore((s) => s.device)
  const setDevice = useEditorStore((s) => s.setDevice)
  const status = useEditorStore((s) => s.status)
  const publish = useEditorStore((s) => s.publish)
  const setConfigOpen = useEditorStore((s) => s.setConfigOpen)
  const apiCount = useEditorStore((s) =>
    Object.values(s.apiConfig).reduce((n, a) => n + a.length, 0)
  )

  return (
    <Bar>
      <BarGroup>
        <Logo><Bolt /></Logo>
        <ProjectName>flast.vn</ProjectName>
        <Badge variant="neutral">Trang chủ</Badge>
      </BarGroup>

      <BarCenter>
        <Tooltip label="Chế độ chọn" kbd="V">
          <IconButton aria-label="Chọn" variant="solid" size="sm"><Cursor /></IconButton>
        </Tooltip>
        <Sep />
        <Tooltip label="Hoàn tác" kbd="⌘Z">
          <IconButton aria-label="Hoàn tác" variant="ghost" size="sm"><Undo /></IconButton>
        </Tooltip>
        <Tooltip label="Làm lại">
          <IconButton aria-label="Làm lại" variant="ghost" size="sm"><Redo /></IconButton>
        </Tooltip>
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
        <Tooltip label="Cấu hình API" kbd="⌘K">
          <CfgWrap>
            <IconButton aria-label="Cấu hình API" variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
              <Gear />
            </IconButton>
            {apiCount > 0 && <CfgCount>{apiCount}</CfgCount>}
          </CfgWrap>
        </Tooltip>
      </BarCenter>

      <BarRight>
        <AgentStatus status={status} />
        <Button variant="text" size="small" onClick={publish}>Xuất bản</Button>
        <Avatar>A</Avatar>
      </BarRight>
    </Bar>
  )
}
