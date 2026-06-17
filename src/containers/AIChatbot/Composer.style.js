import styled from 'styled-components'

export const ComposerWrapper = styled.div`
  border-top: 1px solid #e4e4e7;
  background: #fff;
  flex-shrink: 0;
`

export const ChipsRow = styled.div`
  display: flex;
  gap: 6px;
  padding: 8px 12px 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

export const Chip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 99px;
  background: #fff;
  color: #3f3f46;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: #f4f4f5;
    border-color: #a1a1aa;
  }
`

export const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 12px 10px;
`

export const ComposerActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`

export const AttachmentsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px 0;
`

export const AttachmentPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  min-width: 0;
  padding: 4px 8px;
  border: 1px solid #dbeafe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
`

export const AttachmentName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const AttachmentRemove = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    background: rgba(29, 78, 216, 0.12);
    color: #1d4ed8;
  }
`

export const HiddenFileInput = styled.input`
  display: none;
`

export const FootHint = styled.div`
  font-size: 10px;
  color: #a1a1aa;
  padding: 0 12px 8px;
  text-align: center;
`
