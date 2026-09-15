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
  .notification-trigger {
    width: 38px;
    height: 38px;
    margin: 0 10px 0 0 !important;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 9px;
    background: transparent;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: ${({ theme }) => theme.background?.input || '#eef1f6'};
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.palette?.primary || '#1c5fb0'};
      outline-offset: 2px;
    }

    .anticon-bell {
      font-size: 20px;
    }
  }
  .header-language-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 10px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: ${({ theme }) => theme.text.primary};
    transition: background 0.2s, border-color 0.2s;
    &:hover {
      background: ${({ theme }) => theme.background?.input || '#f5f7fa'};
      border-color: ${({ theme }) => theme.palette?.primary || '#ffc015'};
    }
  }
  .header-language-toggle__icon {
    font-size: 20px;
  }
  .header-language-toggle__badge {
    font-size: 12px;
    font-weight: 700;
    min-width: 22px;
    text-align: center;
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

export const NotificationPanel = styled.div`
  width: min(380px, calc(100vw - 24px));
  max-height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e6ee;
  border-radius: 10px;
  background: #fff;
  color: #16233a;
  box-shadow: 0 12px 32px rgba(22, 35, 58, 0.14), 0 2px 6px rgba(22, 35, 58, 0.06);

  button {
    margin-right: 0 !important;
    font-family: inherit;
  }

  .notification-panel__header {
    padding: 14px 16px 10px;
    border-bottom: 1px solid #e2e6ee;
  }

  .notification-panel__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  h3 {
    margin: 0;
    color: #16233a;
    font-size: 15px;
    font-weight: 700;
  }

  .notification-panel__mark-all,
  .notification-panel__footer button {
    padding: 2px;
    border: 0;
    background: transparent;
    color: #1c5fb0;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .notification-panel__mark-all:disabled {
    color: #94a3b8;
    cursor: default;
  }

  .notification-panel__tabs {
    display: flex;
    gap: 4px;
  }

  .notification-panel__tabs button {
    padding: 6px 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .notification-panel__tabs button.active {
    background: #e7eefb;
    color: #1c5fb0;
  }

  .notification-panel__list {
    min-height: 150px;
    overflow-y: auto;
  }

  .notification-panel__list > .ant-empty {
    margin: 36px 0;
  }

  .notification-panel__item {
    width: 100%;
    min-height: 72px;
    display: flex;
    align-items: flex-start;
    gap: 11px;
    padding: 12px 16px;
    border: 0;
    border-bottom: 1px solid #e2e6ee;
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .notification-panel__item:hover {
    background: #eef1f6;
  }

  .notification-panel__item.unread {
    background: #f7faff;
  }

  .notification-panel__item.unread:hover {
    background: #eef4fd;
  }

  .notification-panel__icon {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    font-size: 17px;
  }

  .notification-panel__icon.type-approve { background: #fbf0dc; color: #b6790a; }
  .notification-panel__icon.type-done { background: #e4f5ec; color: #157a4f; }
  .notification-panel__icon.type-alert { background: #fbe9e7; color: #c0392b; }
  .notification-panel__icon.type-info { background: #e7eefb; color: #1c5fb0; }

  .notification-panel__content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .notification-panel__title {
    margin-bottom: 3px;
    color: #16233a;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
  }

  .notification-panel__description {
    margin-bottom: 5px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    color: #64748b;
    font-size: 12px;
    line-height: 1.4;
  }

  .notification-panel__meta {
    min-height: 16px;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 600;
  }

  .notification-panel__unread-dot {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    margin-top: 5px;
    border-radius: 50%;
    background: #1c5fb0;
  }

  .notification-panel__footer {
    padding: 10px 14px;
    border-top: 1px solid #e2e6ee;
    text-align: center;
  }
`;

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

export const UserDropdownPanel = styled.div`
  width: 248px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);

  .user-dropdown-section {
    padding: 18px 18px 16px;
  }

  .user-dropdown-row {
    width: 100%;
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 14px;
    border: 0;
    background: transparent;
    color: #6b7280;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .user-dropdown-row + .user-dropdown-row {
    margin-top: 10px;
  }

  .user-dropdown-row:hover {
    color: #111827;
  }

  .user-dropdown-icon {
    flex: 0 0 auto;
    width: 20px;
    color: currentColor;
    font-size: 19px;
  }

  .user-dropdown-language-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 6px 8px 0 34px;
  }

  .user-dropdown-language-actions button {
    height: 30px;
    border: 1px solid #d8dee9;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  .user-dropdown-language-actions button.active {
    border-color: #0f5bd8;
    background: #0f5bd8;
    color: #fff;
    box-shadow: 0 6px 14px rgba(15, 91, 216, 0.24);
  }

  .user-dropdown-logout {
    width: 100%;
    min-height: 56px;
    display: flex;
    align-items: center;
    gap: 14px;
    border: 0;
    border-top: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 18px;
    color: #dc2626;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }

  .user-dropdown-logout:hover {
    background: #fef2f2;
  }

  @media (max-width: 480px) {
    width: min(248px, calc(100vw - 24px));
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
