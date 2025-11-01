/**************************************************************************/
/*  styles.js                                                             */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import styled from 'styled-components';
import { Layout, Menu } from 'antd';

const HeaderWrapper = styled(Layout.Header)`
  .div-search-customer .ant-input-search {
    min-width: 200px;
    max-width: 100%;
  }

  @media only screen and (max-width: 1113px) {
    .div-search-customer {
      display: none;
    }
  }
  .leftHeader {
    display: flex;
    justify-content: start;
    width: 50%;
    .div-search-customer {
      width: 75%;
    }
    .ant-select-selector {
      border-radius: 8px;
      height: 40px;
      align-items: center;
    }
    .ant-select-selection-search-input {
      height: 38px;
    }
    .ant-input-search-button {
        height: 40px;
    }
    .ant-input {
      padding: 8px 11px;
    }
    @media only screen and (max-width: 1300px) {
      width: 40%;
    }
  }
  .rightHeader {
    display: flex;
    align-items: center;
    button {
      margin-right: 10px;
    }
    .action-feature-icon {
      top: 0 !important;
      right: 0 !important;
    }
    .ant-btn {
      height: 40px;
      padding: 8px 15px;
      border-radius: 8px;
    }
    .ant-btn-primary {
      color: rgb(255, 255, 255);
      border-color: #ffc015;
      background: #ffc015;
      text-shadow: 0 -1px 0 rgb(0 0 0 / 12%);
      box-shadow: 0 2px 0 rgb(0 0 0 / 5%);
    }
  }
  .link-noti {
    margin: 0 10px;
    height: 100%;
    display: block;
    display: flex;
    align-items: center;
    .icon-noti {
      font-size: 25px;
      color: ${({ theme }) => theme.text.primary};
    }
  }
  .reverse-trigger {
    transform: rotate(180deg);
  }
  @media only screen and (max-width: 900px) {
    .rightHeader .btn-header {
      display: none;
    }
  }
  .trigger {
    color: ${({ theme }) => theme.text.primary};
    font-size: 20px;
    margin-right: 15px;
  }
  .option {
    margin-top: 3px;
  }
  .notification {
    position: relative;
    .ant-badge {
      position: absolute;
      top: -15px;
      right: -10px;
    }
  }
  .div-user-info {
    cursor: pointer;
    display: flex;
  }
  .userInfo {
    display: inline-flex;
    flex-direction: column;
    line-height: 20px;
    vertical-align: middle;
    margin-right: 15px;
    margin-left: 10px;
    text-align: right;
    max-width: 250px;
    max-height: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    strong,
    .role {
      text-overflow: ellipsis;
      overflow: hidden;
    }
    @media only screen and (max-width: 1200px) {
      max-width: 150px;
    }
  }
`;

export default HeaderWrapper;

export const MenuStyles = styled(Menu)`
  min-width: 120px;
  .language-item {
    color: ${({ theme }) => theme.palette.primary} !important;
    &.active {
      color: ${({ theme }) => theme.text.primaryButtonTextColor} !important;
    }
    &:hover {
      background: #fff;
      color: ${({ theme }) => theme.palette.primary} !important;
      border: 1px solid ${({ theme }) => theme.palette.primary};
    }
  }
  div.active {
    background: ${({ theme }) => theme.palette.primary};
    border: 1px solid ${({ theme }) => theme.palette.primary};
  }
  .ant-dropdown-menu-item {
    padding: 0;
    .link-menu-item {
      width: 100%;
      height: 100%;
      margin: 0;
      color: ${({ theme }) => theme.text.primary};
    }
    .icon-menu-item {
      margin-right: 10px;
    }
    .div-menu-item {
      display: flex;
      align-items: center;
      padding: 5px 12px;
      & > div {
        color: ${({ theme }) => theme.text.primaryButtonTextColor};
        margin-right: 10px;
        text-align: center;
        width: 32px;
      }
    }
    .profile-menu-item,
    .div-menu-item {
      font-size: 14px;
    }
  }
`;

export const SearchInputStyles = styled.div`
  margin-left: 15px;
  display: flex;
  align-items: center;
  .ant-input-search {
    background: #fff;
    .ant-input {
      border: 1px solid #d4d2f450;
      border-right: none !important;
    }
    .ant-input-group-addon {
      background-color: #fff !important;
      border: 1px solid #d4d2f450;
    }
    .ant-input-group-addon:first-child {
      border-radius: 20px 0 0 20px;
    }
    .ant-input-search-button {
      background: transparent;
      border-radius: 0 20px 20px 0 !important;
      border-color: ${({ theme }) => theme.border.default} !important;
      border-left: none;
    }
    .ant-select-selection {
      border: none !important;
    }
    .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input)
      .ant-select-selector {
      border: none !important;
      box-shadow: none;
    }
  }

  &.search-focused,
  &:hover {
    .ant-input {
      box-shadow: none !important;
    }
    .ant-input,
    .ant-input-group-addon,
    .ant-input-search-button {
      border-color: ${({ theme }) => theme.palette.primary} !important;
    }
  }
`;
