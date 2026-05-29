/*
 * Composer.js
 *
 * Suggestion chips + textarea + send button.
 * Enter gửi, Shift+Enter xuống dòng.
 */

import { useState } from 'react'
import { Input, Button } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import * as AntdIcons from '@ant-design/icons'
import {
  ComposerWrapper,
  ChipsRow,
  Chip,
  InputRow,
  FootHint,
} from './Composer.style'

const { TextArea } = Input

/* Render icon antd theo tên string */
const DynamicIcon = ({ name }) => {
  const Icon = AntdIcons[name]
  return Icon ? <Icon style={{ fontSize: 10 }} /> : null
}

const Composer = ({ suggestions = [], onSend, disabled, placeholder }) => {
  const [text, setText] = useState('')

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleChip = (chipText) => {
    if (disabled) return
    onSend(chipText)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <ComposerWrapper>
      {/* Suggestion chips */}
      {suggestions.length > 0 && (
        <ChipsRow>
          {suggestions.map((chip, i) => (
            <Chip key={i} onClick={() => handleChip(chip.text)} disabled={disabled}>
              <DynamicIcon name={chip.icon} />
              {chip.text}
            </Chip>
          ))}
        </ChipsRow>
      )}

      {/* Input row */}
      <InputRow>
        <TextArea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Mô tả thay đổi mong muốn…'}
          autoSize={{ minRows: 1, maxRows: 5 }}
          disabled={disabled}
          style={{ flex: 1, fontSize: 12.5, borderRadius: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={disabled}
          disabled={!text.trim()}
          style={{ flexShrink: 0 }}
        />
      </InputRow>

      <FootHint>Hỗ trợ ngữ cảnh · Shift+Enter để xuống dòng</FootHint>
    </ComposerWrapper>
  )
}

export default Composer