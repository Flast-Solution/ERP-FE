import styled from 'styled-components'

// ─── Container ────────────────────────────────────────────────────────────────

export const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-left: 1px solid #f0f0f0;
  width: 380px;
  flex-shrink: 0;
`

export const PanelHeader = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

export const PanelTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`

export const PanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`

// ─── Empty state (chưa chọn field) ───────────────────────────────────────────

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #bfbfbf;
  padding: 32px 16px;
  text-align: center;
`

export const EmptyStateIcon = styled.div`
  font-size: 28px;
  line-height: 1;
`

export const EmptyStateText = styled.div`
  font-size: 13px;
  color: #bfbfbf;
`

// ─── Sections ─────────────────────────────────────────────────────────────────

export const Section = styled.div`
  padding: 14px 16px 0;
`

export const SectionDivider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0 0;
`

export const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 12px;
`

// ─── Field key input ──────────────────────────────────────────────────────────

export const FieldKeyHint = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 5px;
  margin-bottom: 10px;
  line-height: 1.5;
`

export const FieldKeyWarning = styled.div`
  font-size: 11px;
  color: #ff4d4f;
  margin-top: 0px;
  margin-bottom: 12px;
  line-height: 1.5;
`

// ─── Toggle row ───────────────────────────────────────────────────────────────

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
`

export const ToggleLabel = styled.span`
  font-size: 13px;
  color: #262626;
`

// ─── Min/Max row ──────────────────────────────────────────────────────────────

export const MinMaxRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
`

export const MinMaxLabel = styled.div`
  font-size: 12px;
  color: #595959;
  margin-bottom: 4px;
`

// ─── Options editor ───────────────────────────────────────────────────────────

export const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
`

export const OptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const OptionRemoveBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: #bfbfbf;
  font-size: 12px;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.1s, background 0.1s;

  &:hover {
    color: ${({ disabled }) => (disabled ? '#bfbfbf' : '#ff4d4f')};
    background: ${({ disabled }) => (disabled ? 'none' : '#fff1f0')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

export const AddOptionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #1677ff;
  padding: 2px 0 12px;
  transition: color 0.1s;

  &:hover {
    color: ${({ disabled }) => (disabled ? '#1677ff' : '#0958d9')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`

// ─── Input type badge ─────────────────────────────────────────────────────────

export const InputTypeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  color: #595959;
  margin-bottom: 12px;
`

// ─── ColSpan picker ───────────────────────────────────────────────────────────

export const ColSpanRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

export const ColSpanValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1677ff;
  min-width: 28px;
  text-align: right;
  flex-shrink: 0;
`

export const ColSpanPreset = styled.button`
  flex: 1;
  padding: 3px 0;
  border: 1px solid ${({ $active }) => ($active ? '#1677ff' : '#d9d9d9')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#e6f4ff' : '#fff')};
  color: ${({ $active }) => ($active ? '#1677ff' : '#595959')};
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ disabled, $active }) => (disabled ? ($active ? '#1677ff' : '#d9d9d9') : '#1677ff')};
    color: ${({ disabled, $active }) => (disabled ? ($active ? '#1677ff' : '#595959') : '#1677ff')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`
