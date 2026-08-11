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
  padding: 20px 4px 8px;
  color: #20242c;

  .lead-form-section {
    padding: 22px;
    margin-bottom: 18px;
    background: #fff;
    border: 1px solid #e7eaf0;
    border-radius: 14px;
    box-shadow: 0 3px 14px rgba(23, 36, 59, 0.04);
  }

  .lead-form-section__head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .lead-form-section__number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    color: #fff;
    font-weight: 700;
    background: #ff4d4f;
    border-radius: 50%;
  }

  .lead-form-section__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .lead-customer-type .ant-radio-button-wrapper {
    min-width: 150px;
    text-align: center;
  }

  .lead-field-hint {
    margin-top: -14px;
    margin-bottom: 16px;
    color: #8c8c8c;
    font-size: 12px;
  }

  .lead-readonly .ant-input,
  .lead-readonly .ant-select-selector {
    color: #595959 !important;
    background: #f5f6f8 !important;
    border-color: #e2e5ea !important;
  }

  .lead-upload {
    margin-top: 4px;
  }

  .lead-upload-list {
    margin-top: 12px;
  }

  .lead-form-actions {
    position: sticky;
    bottom: -1px;
    z-index: 2;
    display: flex;
    justify-content: flex-end;
    padding: 14px 0 4px;
    background: linear-gradient(180deg, rgba(255,255,255,0), #fff 28%);
  }

  .ant-form-item-label > label {
    font-weight: 600;
  }

  @media (max-width: 767px) {
    padding-top: 8px;

    .lead-form-section {
      padding: 16px;
    }

    .lead-customer-type {
      display: flex;
    }

    .lead-customer-type .ant-radio-button-wrapper {
      flex: 1;
      min-width: 0;
    }
  }
`
