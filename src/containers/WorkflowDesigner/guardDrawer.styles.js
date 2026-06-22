import styled from 'styled-components'

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
`

export const DrawerTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  line-height: 1.25;
`

export const DrawerSubtitle = styled.div`
  font-size: 12px;
  color: #71717a;
  margin-top: 4px;
  line-height: 1.45;
`

export const DrawerFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  background: #fff;
`

export const DrawerShell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
`

export const GuardTypeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const GuardTypeCard = styled.button`
  width: 100%;
  border: 1px solid ${({ $active }) => ($active ? '#91caff' : '#f0f0f0')};
  background: ${({ $active }) => ($active ? '#e6f4ff' : '#fff')};
  border-radius: 8px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #91caff;
    box-shadow: 0 2px 8px rgba(22, 119, 255, 0.1);
  }
`

export const GuardTypeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

export const GuardTypeName = styled.div`
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: #262626;
`

export const GuardTypeDesc = styled.div`
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.45;
  color: #71717a;
`

export const CodeChip = styled.span`
  flex-shrink: 0;
  max-width: 132px;
  padding: 2px 6px;
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#fff' : '#f5f5f5')};
  color: ${({ $active }) => ($active ? '#0958d9' : '#71717a')};
  font-family: monospace;
  font-size: 10px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const ConfigSection = styled.div`
  border-top: 1px solid #f0f0f0;
  padding-top: 14px;
  margin-top: 14px;
`

export const SectionTitle = styled.div`
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #262626;
`

export const ConditionBuilder = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px;
  background: #fafafa;
`

export const ConditionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .ant-form-item {
    margin-bottom: 0;
  }
`

export const ConditionLabel = styled.div`
  flex-shrink: 0;
  height: 24px;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #71717a;
`

export const FieldHelp = styled.div`
  margin-top: 6px;
  font-size: 11px;
  color: #8c8c8c;
  line-height: 1.45;
`
