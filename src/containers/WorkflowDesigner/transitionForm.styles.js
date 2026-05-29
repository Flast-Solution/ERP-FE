import styled from 'styled-components'

export const StepInfoCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
`

export const StepBox = styled.div`
  flex: 1;
  min-width: 0;
`

export const StepBoxLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
`

export const StepBoxName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const StepBoxCode = styled.div`
  font-size: 10px;
  font-family: monospace;
  color: #8c8c8c;
  margin-top: 1px;
`

export const GuardsEmpty = styled.div`
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  color: #8c8c8c;
  font-size: 12px;
  margin-bottom: 12px;

  .link {
    color: #1677ff;
    cursor: pointer;
    margin-top: 4px;
    display: block;
    &:hover {
      text-decoration: underline;
    }
  }
`

export const GuardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid #ffe7ba;
  background: #fffbe6;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: #fff1b8;
  }
`

export const GuardRowLeft = styled.div`
  flex: 1;
  min-width: 0;
`

export const GuardRowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`

export const SlideWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`

export const SlideTrack = styled.div`
  display: flex;
  width: 200%;
  height: 100%;
  transform: translateX(${({ $showSub }) => ($showSub ? '-50%' : '0')});
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
`

export const SlidePane = styled.div`
  width: 50%;
  height: 100%;
  flex-shrink: 0;
  overflow-y: auto;
`
