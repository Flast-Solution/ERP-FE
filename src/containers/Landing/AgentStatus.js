import { StatusWrap, Dot, Spinner } from './AgentStatus.style'

const LABELS = { idle: 'Sẵn sàng', thinking: 'Đang suy nghĩ…', applied: 'Đã áp dụng', error: 'Lỗi' }

export function AgentStatus({ status = 'idle', label, ...rest }) {
  const text = label ?? LABELS[status] ?? status

  return (
    <StatusWrap $status={status} {...rest}>
      {status === 'thinking' ? <Spinner /> : <Dot />}
      {text}
    </StatusWrap>
  )
}
