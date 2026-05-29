import styled from 'styled-components'

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

export const DrawerTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #262626;
`

export const DrawerSubtitle = styled.div`
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 1px;
`

export const DrawerFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
  display: flex;
  gap: 8px;
`
