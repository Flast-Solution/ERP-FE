/*
 * Composer.js
 *
 * Suggestion chips + textarea + send button.
 * Enter gửi, Shift+Enter xuống dòng.
 */

import { useRef, useState } from 'react'
import { Input, Button, message } from 'antd'
import {
  CloseOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@ant-design/icons'
import * as AntdIcons from '@ant-design/icons'
import {
  ComposerWrapper,
  ChipsRow,
  Chip,
  InputRow,
  FootHint,
  ComposerActions,
  AttachmentsRow,
  AttachmentPill,
  AttachmentName,
  AttachmentRemove,
  HiddenFileInput,
  HumanInputBanner,
  HumanInputLabel,
  HumanInputQuestion,
} from './Composer.style'

const { TextArea } = Input
const MAX_ATTACHMENTS = 5
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILES = [
  'image/*',
  '.xls',
  '.xlsx',
  '.doc',
  '.docx',
  '.csv',
  '.txt',
].join(',')

const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

/* Render icon antd theo tên string */
const DynamicIcon = ({ name }) => {
  const Icon = AntdIcons[name]
  return Icon ? <Icon style={{ fontSize: 10 }} /> : null
}

const Composer = ({ 
  suggestions = [], 
  onSend, 
  onHumanInputReply, 
  disabled, 
  placeholder, 
  humanInput = null 
}) => {

  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)

  /* humanInput: { request_id, question } | null
     Khi có humanInput → composer chuyển sang chế độ reply:
     - Hiển thị question
     - Send gọi onHumanInputReply(request_id, answer) thay vì onSend */
  const isHumanInputMode = Boolean(humanInput)

  /* Trong human input mode, luôn cho phép nhập dù prop disabled=true
     vì AI đang chờ input của user, không phải đang xử lý */
  const isDisabled = isHumanInputMode ? false : disabled

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isDisabled) return

    if (isHumanInputMode) {
      onHumanInputReply?.(humanInput.request_id, trimmed)
    } else {
      onSend(trimmed)
    }
    setText('')
    setAttachments([])
  }

  const handleChip = (chipText) => {
    if (isDisabled) return
    onSend(chipText)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePickFiles = () => {
    if (isDisabled) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const pickedFiles = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (!pickedFiles.length) {
      return
    }

    const availableSlots = MAX_ATTACHMENTS - attachments.length
    if (availableSlots <= 0) {
      message.warning(`Chỉ đính kèm tối đa ${MAX_ATTACHMENTS} file mỗi lần gửi.`)
      return
    }

    const validFiles = pickedFiles
      .filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          message.warning(`${file.name} vượt quá giới hạn ${formatFileSize(MAX_FILE_SIZE)}.`)
          return false
        }
        return true
      })
      .slice(0, availableSlots)

    if (pickedFiles.length > availableSlots) {
      message.warning(`Chỉ thêm ${availableSlots} file còn trống.`)
    }

    setAttachments(current => [...current, ...validFiles])
  }

  const removeAttachment = (index) => {
    setAttachments(current => current.filter((_, i) => i !== index))
  }

  return (
    <ComposerWrapper>
      {/* Human input mode — hiển thị question từ server thay vì suggestion chips */}
      {isHumanInputMode ? (
        <HumanInputBanner>
          <HumanInputLabel>Yêu cầu xác nhận</HumanInputLabel>
          <HumanInputQuestion>{humanInput.question}</HumanInputQuestion>
        </HumanInputBanner>
      ) : (
        /* Suggestion chips — chỉ hiện khi không ở human input mode */
        suggestions.length > 0 && (
          <ChipsRow>
            {suggestions.map((chip, i) => (
              <Chip key={i} onClick={() => handleChip(chip.text)} disabled={isDisabled}>
                <DynamicIcon name={chip.icon} />
                {chip.text}
              </Chip>
            ))}
          </ChipsRow>
        )
      )}

      {attachments.length > 0 && (
        <AttachmentsRow>
          {attachments.map((file, index) => (
            <AttachmentPill key={`${file.name}-${file.size}-${index}`}>
              {file.type.startsWith('image/')
                ? <FileImageOutlined />
                : <FileTextOutlined />
              }
              <AttachmentName title={`${file.name} · ${formatFileSize(file.size)}`}>
                {file.name}
              </AttachmentName>
              <AttachmentRemove
                type="button"
                onClick={() => removeAttachment(index)}
                aria-label={`Bỏ file ${file.name}`}
              >
                <CloseOutlined style={{ fontSize: 10 }} />
              </AttachmentRemove>
            </AttachmentPill>
          ))}
        </AttachmentsRow>
      )}

      {/* Input row */}
      <InputRow>
        <TextArea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isHumanInputMode ? 'Nhập câu trả lời…' : (placeholder ?? 'Mô tả thay đổi mong muốn…')}
          autoSize={{ minRows: 3, maxRows: 9 }}
          disabled={isDisabled}
          style={{ flex: 1, fontSize: 12.5, borderRadius: 8, minHeight: 96 }}
        />
        <ComposerActions>
          <Button
            icon={<PaperClipOutlined />}
            onClick={handlePickFiles}
            disabled={isDisabled || attachments.length >= MAX_ATTACHMENTS}
            style={{ flexShrink: 0 }}
            title="Đính kèm ảnh, Excel, Word"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={disabled && !isHumanInputMode}
            disabled={!text.trim()}
            style={{ flexShrink: 0 }}
          />
        </ComposerActions>
        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          onChange={handleFileChange}
        />
      </InputRow>

      <FootHint>Đính kèm file đang chờ API upload · Shift+Enter để xuống dòng</FootHint>
    </ComposerWrapper>
  )
}

export default Composer
