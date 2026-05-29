/*
 * DiffCard.js
 *
 * Hiển thị diff bên trong AI reply bubble.
 * Nhận diff object từ server và gọi onApply khi user bấm "Áp dụng".
 *
 * diff shape (từ server Qwen-agent):
 * {
 *   path  : string                         — đường dẫn file
 *   badge : string                         — "+8 / −0"
 *   lines : { kind: 'add'|'del'|'ctx', text: string }[]
 * }
 */

import { Button, Tooltip } from 'antd'
import {
  FileOutlined,
  CheckOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import {
  DiffWrapper,
  DiffHead,
  DiffPath,
  DiffBadge,
  DiffBody,
  DiffLine,
  DiffFoot,
  DiffActions,
} from './DiffCard.style'

const PREFIX = { add: '+ ', del: '− ', ctx: '  ' }

const DiffCard = ({ diff, onApply, onView }) => {
  if (!diff) return null

  const { path = '', badge = '', lines = [] } = diff

  return (
    <DiffWrapper>

      {/* ── Head ── */}
      <DiffHead>
        <DiffPath>
          <FileOutlined />
          {path}
        </DiffPath>
        {badge && <DiffBadge>{badge}</DiffBadge>}
      </DiffHead>

      {/* ── Diff lines ── */}
      <DiffBody>
        {lines.map((line, i) => (
          <DiffLine key={i} $kind={line.kind}>
            {PREFIX[line.kind] ?? '  '}{line.text}
          </DiffLine>
        ))}
      </DiffBody>

      {/* ── Footer actions ── */}
      <DiffFoot>
        <DiffActions>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            style={{ height: 24, padding: '0 8px', fontSize: 11 }}
            onClick={onApply}
          >
            Áp dụng
          </Button>

          <Button
            size="small"
            style={{ height: 24, padding: '0 8px', fontSize: 11 }}
            icon={<EyeOutlined />}
            onClick={onView}
          >
            Xem file
          </Button>
        </DiffActions>

        <Tooltip title="Lịch sử thay đổi">
          <HistoryOutlined style={{ color: '#9ca3af', fontSize: 12, cursor: 'pointer' }} />
        </Tooltip>
      </DiffFoot>

    </DiffWrapper>
  )
}

export default DiffCard