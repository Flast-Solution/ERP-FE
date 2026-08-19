import { Button, DatePicker, Drawer, Form, Segmented } from 'antd';
import styled from 'styled-components';

export const KpiDrawer = styled(Drawer)`
  .ant-drawer-header {
    min-height: 142px;
    align-items: flex-start;
    padding: 24px 28px;
    border-bottom-color: #e2e8f0;
  }

  .ant-drawer-header-title {
    align-items: flex-start;
  }

  .ant-drawer-title {
    min-width: 0;
  }

  .ant-drawer-close {
    margin-top: 7px;
    color: #0f172a;
    font-size: 20px;
  }

  .ant-drawer-body {
    padding: 26px 28px 110px;
  }

  .ant-drawer-footer {
    padding: 16px 28px;
    border-top-color: #e2e8f0;
    background: #fff;
  }

  @media (max-width: 640px) {
    .ant-drawer-header,
    .ant-drawer-body,
    .ant-drawer-footer {
      padding-right: 18px;
      padding-left: 18px;
    }
  }
`;

export const DrawerHeading = styled.div`
  min-width: 0;
`;

export const DrawerEyebrow = styled.div`
  margin-bottom: 5px;
  color: #717987;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
`;

export const DrawerTitle = styled.div`
  overflow: hidden;
  color: #0f172a;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.35px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const DrawerOwner = styled.div`
  margin-top: 7px;
  color: #64748b;
  font-size: 15px;
  font-weight: 400;
`;

export const DrawerCloseButton = styled(Button)`
  && {
    width: 40px;
    height: 40px;
    color: #0f172a;
    font-size: 20px;
  }
`;

export const DrawerForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 20px;
  }

  .ant-form-item-label {
    padding-bottom: 7px;
  }

  .ant-form-item-label > label {
    height: auto;
    color: #172033;
    font-size: 14px;
    font-weight: 650;
  }

  .ant-form-item-required::before {
    order: 2;
  }
  .ant-form-item .ant-form-item-label >label::after {
    content: ":";
    position: relative;
    margin-block: 0;
    margin-inline-start: 2px;
    margin-inline-end: 0 !important;
}

  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-select-selector,
  .ant-picker {
    border-color: #dce2ea !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    font-size: 15px;
  }

  .ant-input:not(textarea),
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-select-selector,
  .ant-picker {
    min-height: 46px;
  }

  .ant-input-affix-wrapper > .ant-input {
    min-height: auto;
  }

  .ant-input-number {
    width: 100%;
  }

  .ant-picker {
    width: 100%;
  }

  .ant-input-number-input {
    height: 44px;
  }

  .ant-select-single {
    height: 46px;
  }

  .ant-select-single .ant-select-selector {
    align-items: center;
  }

  textarea.ant-input {
    min-height: 108px;
    padding: 12px 14px;
    resize: vertical;
  }

  .ant-input-disabled {
    background: #fff;
    color: #9aa5b5;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

export const FullSegmented = styled(Segmented)`
  && {
    display: flex;
    padding: 3px;
    border: 1px solid #dce2ea;
    border-radius: 8px;
    background: #f8fafc;
  }

  .ant-segmented-group {
    width: 100%;
  }

  .ant-segmented-item {
    flex: 1;
    color: #5f697a;
    font-weight: 600;
    text-align: center;
  }

  .ant-segmented-item-selected {
    color: #172033;
  }
`;

export const FullDatePicker = styled(DatePicker)`
  && {
    width: 100%;
    height: 46px;
  }

  .ant-picker-input > input {
    font-size: 15px;
  }
`;

export const PeriodHint = styled.p`
  margin: -2px 0 0;
  color: #7b8494;
  font-size: 13px;
  line-height: 1.5;
`;

export const GuardText = styled.p`
  margin: -2px 0 0;
  color: #7b8494;
  font-size: 13px;
  line-height: 1.5;
`;

export const DrawerFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${({ $edit }) => ($edit ? 'space-between' : 'flex-end')};
  gap: 16px;
`;

export const FooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CancelButton = styled(Button)`
  && {
    height: 42px;
    padding: 0 18px;
    color: #5f697a;
    font-weight: 600;
  }
`;

export const SaveButton = styled(Button)`
  && {
    height: 42px;
    padding: 0 18px;
    border-color: #4f46e5;
    border-radius: 8px;
    background: #4f46e5;
    box-shadow: none;
    font-weight: 600;
  }
`;

export const DeleteButton = styled(Button)`
  && {
    height: 42px;
    padding: 0 16px;
    border-radius: 8px;
    font-weight: 600;
  }
`;
