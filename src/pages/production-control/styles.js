import styled from 'styled-components';

const ProductionPage = styled.div`
  --primary: #4f46e5;
  --border: #e2e8f0;
  --muted: #64748b;
  color: #172033;
  font-size: 14px;
  max-width: none;
  margin: 0 auto;

  .production-card {
    min-height: 100vh;
    background: #fff;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    overflow: hidden;
  }
  .page-head { padding: 20px 24px; background: #fbfcfe; border-bottom: 1px solid var(--border); }
  .crumb { display: flex; gap: 8px; align-items: center; color: #7b8494; font-size: 13px; margin-bottom: 12px; }
  .crumb .current { color: #4b5565; font-weight: 600; }
  .head-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  h1 { font-size: 24px; line-height: 1.25; margin: 0 0 4px; color: #111827; font-weight: 700; }
  .subtitle { color: #5f6b7a; font-size: 14px; }
  .code { display: inline-flex; border: 1px solid #d9e0e8; border-radius: 5px; background: #f7f9fb; padding: 1px 8px; color: #566274; font: 14px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .lot { border: 1px solid #bdcaff; background: #f0f3ff; padding: 9px 16px; border-radius: 8px; font: 17px ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
  .lot b { color: var(--primary); margin-right: 7px; }
  .body { padding: 20px 24px 4px; }
  .alert { margin: 20px 24px 0; border: 1px solid #f3d46b; background: #fff6cf; color: #ad6815; border-radius: 6px; padding: 10px 12px; display: flex; gap: 8px; align-items: center; font-size: 14px; }
  .section { margin-bottom: 24px; }
  .section-head { display: flex; align-items: center; min-height: 32px; border-bottom: 1px solid #e8edf3; margin-bottom: 16px; padding-bottom: 8px; }
  .section-no { width: 24px; height: 24px; display: inline-grid; place-items: center; margin-right: 8px; border-radius: 5px; background: #eef2ff; color: var(--primary); font-size: 13px; font-weight: 700; }
  h2 { margin: 0; font-size: 18px; font-weight: 700; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  .grid > .ant-form-item { margin-bottom: 0; min-width: 0; }
  .product-block { padding: 14px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: 8px; background: #fafafa; }
  .product-block__title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #262626; }
  .product-block__title > div:first-child { min-width: 0; }
  .product-block__code { margin-left: 8px; font-size: 12px; font-family: monospace; font-weight: 400; color: #8c8c8c; }
  .product-block .ant-input[readonly] { color: #595959; background: #f5f5f5; cursor: default; }
  .empty-products { padding: 24px 16px; border: 1px dashed var(--border); border-radius: 8px; text-align: center; color: #8c8c8c; background: #fafafa; }
  .field.full { grid-column: 1 / -1; }
  label { display: block; font-size: 14px; font-weight: 600; }
  .req { color: #dc2626; margin: 0 4px; }
  .readonly { min-height: 44px; border: 1px dashed #d7dee8; background: #f8fafc; border-radius: 8px; padding: 0 14px; display: flex; align-items: center; justify-content: space-between; font-size: 16px; }
  .auto { color: #7c8594; font-size: 12px; text-transform: uppercase; }
  .ant-input, .ant-select-selector, .ant-picker { border-radius: 6px !important; font-size: 14px !important; }
  textarea.ant-input { min-height: 72px !important; resize: vertical; }
  .radio-group { display: flex; gap: 8px; }
  .radio-group .ant-radio-wrapper { border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; margin: 0; }
  .radio-group .ant-radio-wrapper-checked { border-color: var(--primary); background: #f3f2ff; color: var(--primary); }
  .badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 3px 11px; font-size: 13px; font-weight: 600; }
  .badge:before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .success { color: #209653; background: #dcfce7; border: 1px solid #a7efbf; }
  .danger { color: #dc3232; background: #fee8e8; border: 1px solid #ffc2c2; }
  .section-head .badge, .section-head .code { margin-left: auto; }
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
  .ant-table-wrapper { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .ant-table-wrapper .ant-table-thead > tr > th { background: ${({ theme }) => theme.table?.headerBackground || '#f7f9fc'}; }
  .ant-table-wrapper .ant-form-item { margin-bottom: 0; }
  .table-action { padding: 10px 14px; border: 1px solid var(--border); border-top: 0; background: #f8fafc; }
  .table-action .custom-button { display: block !important; }
  table { border-collapse: collapse; width: 100%; min-width: 720px; font-size: 15px; }
  th { text-align: left; padding: 10px 12px; background: #f7f9fc; color: #6b7483; font-size: 12px; text-transform: uppercase; }
  td { padding: 8px 12px; border-top: 1px solid #e7ebf0; }
  th.num, td.num { text-align: right; }
  th.mid, td.mid { text-align: center; }
  .cell-input { min-height: 36px; padding: 0 11px; border: 1px solid #dbe2ea; border-radius: 6px; display: flex; align-items: center; }
  .delete-row { border: 0; background: transparent; cursor: pointer; font-size: 16px; }
  tfoot td { background: #f8fafc; }
  .add-row { border: 0; background: transparent; cursor: pointer; color: #586475; padding: 3px; }
  .foot { background: #fbfcfe; border-top: 1px solid var(--border); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .foot-note { color: #747f90; font-size: 13px; }
  .actions { display: flex; gap: 8px; flex-shrink: 0; }
  .actions .custom-button { display: block !important; }
  .actions .ant-btn { padding: 0 16px; border-radius: 6px; }

  @media (max-width: 800px) {
    .page-head, .body { padding-left: 16px; padding-right: 16px; }
    .alert { margin-left: 16px; margin-right: 16px; }
    .grid { grid-template-columns: 1fr; }
    .field.full { grid-column: auto; }
    .head-row, .foot { align-items: flex-start; flex-direction: column; }
    .foot { padding: 16px; }
    .actions { width: 100%; }
    .actions .ant-btn { flex: 1; }
    h1 { font-size: 22px; }
  }
`;

export default ProductionPage;
