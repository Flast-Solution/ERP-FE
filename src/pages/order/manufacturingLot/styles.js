import { Button } from 'antd'
import styled from 'styled-components'

export const PageShell = styled.div`
  min-height: calc(100vh - 80px);
  padding: 16px 24px 0;
  background: #fff;

  @media (max-width: 767px) {
    padding: 12px;
  }
`;

export const HeaderBlock = styled.div`
  margin-bottom: 28px;

  .ant-typography {
    margin-bottom: 0;
  }

  h2.ant-typography {
    margin-top: 12px;
    font-size: 28px;
    line-height: 1.2;
  }

  @media (max-width: 767px) {
    margin-bottom: 20px;

    h2.ant-typography {
      font-size: 24px;
    }
  }
`;

export const MainLayout = styled.div`
  border-top: 1px solid #e5e7eb;

  @media (max-width: 991px) {
    border-top: 0;
  }
`;

export const FormPanel = styled.div`
  min-height: calc(100vh - 210px);
  padding: 32px 32px 32px 0;
  border-right: 1px solid #e5e7eb;

  .ant-form-item-label > label {
    font-weight: 600;
    color: #111827;
  }

  .ant-input,
  .ant-input-number,
  .ant-picker,
  .ant-select-selector {
    min-height: 40px;
    border-color: #9ca3af !important;
    border-radius: 3px !important;
    background: #fff !important;
  }

  .ant-input-number,
  .ant-picker {
    width: 100%;
  }

  textarea.ant-input {
    min-height: 96px;
  }

  @media (max-width: 991px) {
    min-height: auto;
    padding: 0 0 24px;
    border-right: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 26px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

export const ExistingLotsPanel = styled.div`
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

export const ExistingLotsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  span {
    font-size: 13px;
    color: #6b7280;
  }
`;

export const ExistingLotList = styled.div`
  display: grid;
  gap: 10px;
`;

export const ExistingLotItem = styled.button`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${({ $active }) => ($active ? '#0b63ce' : '#d1d5db')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#eff6ff' : '#fff')};
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: #0b63ce;
    background: #eff6ff;
  }

  .lot-main {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }

  .lot-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 8px;
    font-size: 12px;
    color: #6b7280;
  }
`;

export const ExistingLotsEmpty = styled.div`
  padding: 16px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 13px;
`;

export const LotBlock = styled.div`
  & + & {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px dashed #d1d5db;
  }
`;

export const LotBlockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .lot-title {
    font-weight: 700;
    color: #111827;
  }

  .ant-btn {
    height: 32px;
    padding: 0 10px;
    border-radius: 4px;
  }
`;

export const AddLotButton = styled(Button)`
  min-width: 180px;
  height: 44px;
  margin-top: 8px;
  border-radius: 4px;
  background: #0b63ce;
  box-shadow: 0 4px 10px rgba(11, 99, 206, 0.25);
  font-weight: 600;
`;

export const SummaryPanel = styled.aside`
  position: sticky;
  top: 88px;
  padding: 32px 0 32px 32px;

  @media (max-width: 991px) {
    position: static;
    padding: 24px 0 32px;
    border-top: 1px solid #e5e7eb;
  }
`;

export const SummaryTitle = styled.div`
  margin-bottom: 28px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

export const OrderLineHeader = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 56px 96px;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #111827;
`;

export const OrderLine = styled.div`
  display: grid;
  grid-template-columns: 32px 1fr 56px 96px;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #111827;

  .line-name {
    font-weight: 600;
  }

  .line-desc {
    margin-top: 8px;
    font-size: 11px;
    line-height: 1.5;
    color: #1f2937;
    text-transform: uppercase;
  }

  .line-qty,
  .line-money {
    text-align: right;
  }

  .line-money {
    font-weight: 700;
  }
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  color: #111827;

  strong {
    font-weight: 700;
  }

  &.total {
    margin-top: 16px;
    font-size: 16px;
    font-weight: 700;

    strong {
      color: #0b63ce;
    }
  }

  &.remaining {
    align-items: center;
    margin-top: 8px;
    padding: 8px;
    border: 1px solid #e5e7eb;
    font-weight: 700;

    strong {
      color: #0b63ce;
      font-size: 16px;
    }
  }
`;

export const CompleteButton = styled(Button)`
  width: 100%;
  height: 44px;
  margin-top: 20px;
  border-radius: 4px;
  background: #0b63ce;
  box-shadow: 0 4px 10px rgba(11, 99, 206, 0.25);
  font-weight: 700;
`;
