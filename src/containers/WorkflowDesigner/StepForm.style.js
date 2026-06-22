import styled from 'styled-components'

// ─── Sections ─────────────────────────────────────────────────────────────────

export const Section = styled.div`
  padding: 16px 16px 0;
`

export const SectionDivider = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: 16px 0 0;
`

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`

export const SectionTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
`

export const SectionAction = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #1677ff;
  padding: 0;
  line-height: 1;

  &:hover {
    color: #0958d9;
  }
`

// ─── Field hints ──────────────────────────────────────────────────────────────

export const FieldHint = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: -6px;
  margin-bottom: 10px;
  line-height: 1.5;
`

// ─── Loại bước — radio pill group ────────────────────────────────────────────

export const TypePillGroup = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

export const TypePillBtn = styled.button`
  padding: 5px 14px;
  border-radius: 6px;
  border: 1.5px solid ${({ $active }) => ($active ? '#1677ff' : '#e4e4e4')};
  background: ${({ $active }) => ($active ? '#e6f4ff' : '#fff')};
  color: ${({ $active }) => ($active ? '#1677ff' : '#595959')};
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;

  &:hover {
    border-color: #1677ff;
    color: #1677ff;
  }
`

// ─── Empty state ──────────────────────────────────────────────────────────────

export const EmptyState = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 14px 12px;
  text-align: center;
  color: #bfbfbf;
  font-size: 12px;
  background: #fafafa;
  margin-bottom: 4px;
`

// ─── Action item card ─────────────────────────────────────────────────────────

export const ActionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid #e4e4e4;
  background: #fff;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: #f5faff;
    border-color: #91caff;
  }
`

export const ActionItemLabel = styled.div`
  font-size: 12px;
  color: #262626;
  font-weight: 500;
`

export const ActionItemMeta = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 1px;
`

// ─── Form card (Form gắn vào bước) ───────────────────────────────────────────

export const FormCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e4e4e4;
  background: #fff;
  margin-bottom: 6px;
`

export const FormCardInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const FormCardName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const FormCardMeta = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 2px;
`
