import { useRef, useEffect } from 'react'
import { AgentStatus } from './AgentStatus'
import {
  Bar, Top, CtxChip, CtxClose, Spacer,
  FileList, FileItem, FileThumb, FilePlaceholder, FileRemove, FileName,
  Row, AttachBtn, Textarea, SendBtn, SendSpinner,
  ApiList, ApiLabel, ApiChip, ApiMethod, ApiUrl,
  Chips, Chip, Foot, Hint,
} from './EditPromptBar.style'

const METHOD_COLOR = { GET: '#34d399', POST: '#60a5fa', PUT: '#fbbf24', DELETE: '#f87171' }
const apiPath = (u) => { try { return new URL(u).pathname } catch { return u } }

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 3 11 7.5 15.5 9 11 10.5 9.5 15 8 10.5 3.5 9 8 7.5z" />
    <path d="M18 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-4.5-4.5L5 22" />
  </svg>
)

const MiniClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export function EditPromptBar({
  elementId,
  value = '',
  onChange,
  onSubmit,
  onClearContext,
  status = 'idle',
  busy = false,
  placeholder = 'Mô tả thay đổi bạn muốn…',
  suggestions = [],
  onPickSuggestion,
  apis = [],
  attachments = [],
  onAttachFiles,
  onRemoveAttachment,
  accept = 'image/*',
  docked = false,
  showStatus = true,
  ...rest
}) {
  const taRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  const pickFiles = () => fileRef.current?.click()
  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) onAttachFiles?.(files)
    e.target.value = ''
  }

  const canSend = !!value.trim() || attachments.length > 0
  const submit = () => {
    if (busy || !canSend) return
    onSubmit?.(value, elementId, attachments)
  }
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  return (
    <Bar $docked={docked} {...rest}>
      <Top>
        {elementId && (
          <CtxChip>
            #{elementId}
            {onClearContext && (
              <CtxClose type="button" aria-label="Bỏ chọn phần tử" onClick={onClearContext}>
                <CloseIcon />
              </CtxClose>
            )}
          </CtxChip>
        )}
        <Spacer />
        {showStatus && <AgentStatus status={busy ? 'thinking' : status} />}
      </Top>

      {attachments.length > 0 && (
        <FileList>
          {attachments.map((f) => (
            <FileItem key={f.id}>
              {f.url
                ? <FileThumb src={f.url} alt={f.name} />
                : <FilePlaceholder><ImageIcon /></FilePlaceholder>
              }
              <FileRemove type="button" aria-label={`Xoá ${f.name}`} onClick={() => onRemoveAttachment?.(f.id)}>
                <MiniClose />
              </FileRemove>
              <FileName title={f.name}>{f.name}</FileName>
            </FileItem>
          ))}
        </FileList>
      )}

      <Row>
        <input ref={fileRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={onFiles} />
        <AttachBtn type="button" onClick={pickFiles} aria-label="Đính kèm hình ảnh">
          <ImageIcon />
        </AttachBtn>
        <Textarea
          ref={taRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKey}
        />
        <SendBtn type="button" disabled={busy || !canSend} onClick={submit} aria-label="Gửi yêu cầu">
          {busy ? <SendSpinner /> : <SendIcon />}
        </SendBtn>
      </Row>

      {apis.length > 0 && (
        <ApiList>
          <ApiLabel>Nguồn dữ liệu</ApiLabel>
          {apis.map((a) => (
            <ApiChip key={a.id} title={a.url}>
              <ApiMethod $color={METHOD_COLOR[a.method]}>{a.method}</ApiMethod>
              <ApiUrl>{apiPath(a.url)}</ApiUrl>
            </ApiChip>
          ))}
        </ApiList>
      )}

      {suggestions.length > 0 && (
        <Chips>
          {suggestions.map((s, i) => (
            <Chip key={i} type="button" onClick={() => onPickSuggestion?.(s)}>{s}</Chip>
          ))}
        </Chips>
      )}

      <Foot>
        <span>AI sẽ sửa trực tiếp đoạn code của phần tử này.</span>
        <Hint>⏎ gửi · ⇧⏎ xuống dòng</Hint>
      </Foot>
    </Bar>
  )
}
