import styled from 'styled-components';

export const PageShell = styled.div`
  padding: 0;
`;

export const ConfigCard = styled.div`
  border: 0;
  border-radius: 0;
  background: #fff;
  padding: 0;

  .ant-table-thead > tr > th {
    background: #fff;
    font-weight: 700;
    text-transform: uppercase;
  }

  .ant-table-cell {
    font-size: 14px;
  }
`;

export const FilterBar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) 148px 148px;
  gap: 16px;
  align-items: center;
  margin: 26px 0;

  .ant-input,
  .ant-select-selector,
  .ant-btn {
    height: 40px;
    border-radius: 8px;
  }

  .ant-select-selector {
    align-items: center;
  }

  .ant-btn {
    font-weight: 600;
  }

  .clear-filter-button {
    color: #faad14;
    border-color: #faad14;
    background: #fff;
  }

  .clear-filter-button:hover {
    color: #d48806 !important;
    border-color: #d48806 !important;
    background: #fff7e6 !important;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const ListControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: ${({ $placement }) => ($placement === 'top' ? '0 0 24px' : '24px 0 0')};

  .pagination-group {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .range-text {
    color: #111827;
    font-size: 14px;
    white-space: nowrap;
  }

  .ant-pagination {
    display: inline-flex;
    align-items: center;
  }

  .ant-pagination-item,
  .ant-pagination-prev,
  .ant-pagination-next {
    min-width: 36px;
    height: 36px;
    line-height: 34px;
    border-radius: 8px;
  }

  .ant-select-selector,
  .ant-btn {
    height: 40px;
    border-radius: 8px;
  }

  .ant-select-selector {
    align-items: center;
  }

  > .ant-btn-dangerous {
    min-width: 128px;
    background: #ff4d4f;
    border-color: #ff4d4f;
    box-shadow: none;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    align-items: stretch;
    flex-direction: column;

    .pagination-group {
      flex-wrap: wrap;
    }

    > .ant-btn-dangerous {
      width: 100%;
    }
  }
`;

export const ConfigDrawerBody = styled.div`
  margin-top: 20px;

  textarea.ant-input {
    min-height: 110px;
  }

  .ant-form-item {
    margin-bottom: 20px;
  }
`;

export const ConfigFormItem = styled.div`
  border: 1px solid #eef0f5;
  border-radius: 8px;
  padding: 16px 16px 0;
  background: #fff;

  .config-form-item__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
`;

export const OptionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 116px;
  gap: 18px;
  align-items: end;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const AddRowButton = styled.button`
  width: 100%;
  min-height: 48px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #fff;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #2563eb;
    color: #2563eb;
    background: #eff6ff;
  }
`;

export const ConfigDrawerFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
`;
