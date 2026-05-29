import styled from 'styled-components'

export const DiffWrapper = styled.div`
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  margin-top: 8px;
  font-size: 11px;
`

export const DiffHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f9fafb;
  border-bottom: 1px solid #e4e4e7;
  color: #6b7280;
`

export const DiffPath = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
`

export const DiffBadge = styled.span`
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 10px;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 4px;
  padding: 1px 5px;
`

export const DiffBody = styled.div`
  max-height: 180px;
  overflow-y: auto;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  line-height: 1.7;
`

export const DiffLine = styled.div`
  padding: 0 10px;
  white-space: pre;

  ${({ $kind }) => $kind === 'add' && `
    background: rgba(21, 128, 61, 0.10);
    color: #15803d;
  `}

  ${({ $kind }) => $kind === 'del' && `
    background: rgba(185, 28, 28, 0.08);
    color: #b91c1c;
    text-decoration: line-through;
  `}

  ${({ $kind }) => $kind === 'ctx' && `
    color: #9ca3af;
  `}
`

export const DiffFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-top: 1px solid #e4e4e7;
  background: #fafafa;
`

export const DiffActions = styled.div`
  display: flex;
  gap: 5px;
`
