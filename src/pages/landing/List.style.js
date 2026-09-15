import styled from 'styled-components'

export const PageShell = styled.div`
  padding: 0 24px 28px;
`

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin: 18px 0;

  h1 {
    margin: 0 0 5px;
    color: #172033;
    font-size: 24px;
    line-height: 1.3;
  }

  p {
    margin: 0;
    color: #788399;
    font-size: 13px;
  }
`

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`

export const TableCard = styled.div`
  overflow: hidden;
  border: 1px solid #e5e9f0;
  border-radius: 10px;
  background: #fff;

  .ant-table-thead > tr > th {
    background: #f7f8fb;
    color: #5d687c;
    font-size: 12px;
    font-weight: 650;
  }
`

export const PageName = styled.div`
  strong {
    display: block;
    color: #1e293b;
    font-size: 13px;
  }

  span {
    color: #94a0b4;
    font-size: 11px;
  }
`

