import styled from 'styled-components'
import { Row } from 'antd'

const FormStyles = styled(Row)`
  .form-list {
    &__list-item {
      position: relative;
      padding: 15px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    &__remove-button {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 25px;
    }
  }
  .ant-col .ant-form-item {
    margin-bottom: 0 !important;
  }
`

export default FormStyles

export const TableStyle = styled.div`
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 5px;
  .table-bordered {
    width: 100%;
    border: 1px solid #ddd;
  }
  .btn_success {
    color: #fff;
    background-color: #5cb85c;
    border-color: #4cae4c;
  }
  .btn-warning {
    margin-left: 10px;
    color: #fff;
    background-color: #f0ad4e;
    border-color: #eea236;
  }
  .btn-blur {
    color: #fff;
    background-color: #5bc0de;
    border-color: #46b8da;
  }
  .table-bordered > tbody > tr > td {
    border-right: 1px solid #ddd;
    padding: 10px;
  }
  .btn-primary {
    color: #fff;
    background-color: #337ab7;
    border-color: #2e6da4;
    margin-top: 3px;
  }
`

export const FormPriceStyle = styled.div`
  .form-list__list-item .ant-form-item {
    margin-bottom: 0 !important;
  }
`

export const SKUContent = styled.div`
  .ant-typography {
    margin-bottom: 0;
  }
`

export const LeadFormShell = styled.div`
  width: 100%;
  padding: 0;
  color: var(--fg-default);

  .pl-section .ant-form-item,
  .pl-customer-type {
    margin-bottom: 0;
  }

  .pl-customer-type {
    margin-bottom: var(--s-4);
  }

  .ant-form-item-label {
    padding: 0 0 6px;
  }

  .ant-form-item-label > label {
    width: 100%;
    height: auto;
    color: inherit;
    font-weight: inherit;
  }

  .ant-form-item-label > label::after {
    display: none;
  }

  .label .req {
    margin-left: 2px;
  }

  .pl-seg__opt.ant-radio-wrapper {
    margin-inline-end: 0;
  }

  .pl-seg__opt > .ant-radio {
    display: none;
  }

  .pl-input.ant-input,
  textarea.pl-textarea.ant-input {
    box-shadow: none;
  }

  .pl-select.ant-select {
    min-height: 36px;
    padding: 0;
    background: transparent;
    border: 0;
  }

  .pl-select.ant-select .ant-select-selector,
  .lead-products-field .ant-select-selector {
    min-height: 36px;
    padding: 0 var(--s-3);
    color: var(--fg-default);
    background: var(--bg-canvas);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow: none !important;
  }

  .pl-select.ant-select-single .ant-select-selector {
    align-items: center;
  }

  .lead-products-field .ant-form-item {
    margin-bottom: 0;
  }

  .lead-business-caption {
    margin: var(--s-4) 0 6px;
  }

  .lead-business-grid.is-disabled {
    opacity: 0.55;
  }

  .field-help {
    margin-top: 6px;
    color: var(--fg-subtle);
    font-size: var(--fs-12);
  }

  .lead-readonly .ant-input,
  .lead-readonly .ant-select-selector {
    color: var(--fg-muted) !important;
    background: var(--bg-sunken) !important;
    border: 1px dashed var(--border-default) !important;
    box-shadow: none !important;
  }

  .lead-upload-field {
    margin-top: var(--s-5);
  }

  .lead-upload-field .ant-form-item {
    margin-bottom: 0;
  }

  .lead-form-actions {
    justify-content: flex-end;
    margin: 0;
  }

  .lead-form-actions .ant-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  @media (max-width: 720px) {
    padding: 0;
  }
`
