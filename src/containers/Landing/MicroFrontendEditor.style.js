import styled from 'styled-components'

export const EditorShell = styled.div`
  min-height: 100vh;
  padding: 24px;
  background: #f4f6f9;
`

export const EditorHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 18px 22px;
  border: 1px solid #e3e8ef;
  border-radius: 12px;
  background: #fff;

  h1 { margin: 5px 0 3px; color: #172033; font-size: 22px; }
  p { margin: 0; color: #768196; }
`

export const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;

  @media (max-width: 1050px) { grid-template-columns: 1fr; }
`

export const Panel = styled.div`
  padding: 18px;
  border: 1px solid #e3e8ef;
  border-radius: 12px;
  background: #fff;
`

export const RemoteCard = styled.div`
  margin-bottom: 14px;
  border: 1px solid #dfe5ed;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
`

export const RemoteHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #f7f9fc;
  border-bottom: 1px solid #e8edf3;

  strong { color: #263248; }
`

export const RemoteBody = styled.div`
  padding: 14px;
`

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  .span-2 { grid-column: 1 / -1; }
  @media (max-width: 720px) { grid-template-columns: 1fr; .span-2 { grid-column: auto; } }
`

export const FieldLabel = styled.div`
  margin-bottom: 5px;
  color: #536078;
  font-size: 12px;
  font-weight: 600;
`

export const EmptyBox = styled.div`
  padding: 40px 16px;
  text-align: center;
  border: 1px dashed #cfd7e3;
  border-radius: 10px;
  color: #8994a7;
`

export const DataStatus = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid #eef1f5;
  font-size: 12px;
`
