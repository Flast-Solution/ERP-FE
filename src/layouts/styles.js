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

const PrivateLayoutWrapper = styled.div`
  .layout-window-view {
    height: 100vh;
  }

  .site-layout-background {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px);
    overflow-y: auto;
    overflow-x: hidden;
    background: ${({ theme }) => theme.background.backgroundPage};
  }
  .content {
    padding: 20px 20px;
    flex: 1;
  }
  .trigger {
    font-size: 20px;
    padding: 5px;
    cursor: pointer;
    transition: color 0.3s;
    margin-right: 10px;
    &:hover {
      color: ${({ theme }) => theme.palette.primary};
    }
    @media only screen and (max-width: 430px) {
      color: ${({ theme }) => theme.palette.primary};
    }
  }

  .triggerMobile {
    font-size: 20px;
    line-height: 64px;
    cursor: pointer;
    color: ${({ theme }) => theme.palette.primary};
    transition: color 0.3s;
    position: fixed;
    top: 0px;
    left: 20px;
    z-index: 2;
    display: none;
    &:hover {
      color: ${({ theme }) => theme.palette.primary};
    }
    @media only screen and (max-width: 430px) {
      display: block;
    }
  }

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    position: relative;
    img {
      height: 40px;
      width: auto;
      margin: auto;
      object-fit: contain;
    }
    .fullLogo {
      opacity: 0;
      transition: all 0.3s;
    }
  }

  .header {
    z-index: 1;
    background: ${({ theme }) => theme.background.content};
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    transition: all 0.5s ease 0.2s;
    @media only screen and (max-width: 430px) {
      display: inherit;
    }
    .leftHeader {
      display: flex;
      align-items: center;
      @media only screen and (max-width: 430px) {
        width: 100%;
        display: inherit;
        padding-right: 45px;
      }
    }
    .rightHeader {
      @media only screen and (max-width: 430px) {
        display: none;
      }
    }
    .localeSelect {
      padding: 5px;
      font-weight: bold;
      cursor: pointer;
      color: ${({ theme }) => theme.text.disabled};
      &.active {
        color: ${({ theme }) => theme.palette.primary};
      }
    }

    .title {
      display: none;
      opacity: 0;
      transition: opacity 0.3s;
      text-align: center;
      @media only screen and (max-width: 430px) {
        opacity: 1;
        display: inline-block;
        padding-left: 20px;
        font-size: 20px;
        font-weight: 500;
        width: 100%;
      }
    }
  }

  .mainContent {
    padding: 20px;
    background: #fff;
    min-height: 280;
  }

  .footer {
    text-align: center;
    @media only screen and (max-width: 430px) {
      display: none;
    }
  }

  #collapsedTracker {
    width: 0px;
    height: 0px;
    position: absolute;
  }

  @media only screen and (max-width: 430px) {
    .booking-antd-layout-sider-collapsed {
      display: none;
    }

    .sidebar {
      position: fixed;
      z-index: 9999;
      height: 100vh;
    }
    .mainView {
      margin-left: 0px;
      z-index: 1;
    }
    .overlay {
      z-index: 9998;
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      opacity: 0;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.5);
      transition: all 0.5s ease 0s;
    }
    #collapsedTracker:checked ~ .overlay {
      opacity: 1;
      pointer-events: auto;
    }
  }
  .footer {
    background: ${({ theme }) => theme.background.content};
    color: ${({ theme }) => theme.text.primary};
  }
  .footerMobile {
    z-index: 5;
    position: fixed;
    height: 60px;
    left: 0px;
    right: 0px;
    bottom: -60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${({ theme }) => theme.background.content};
    box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.15);
    transition: all 0.5s ease 0.2s;
    a {
      text-align: center;
      flex: 1;
    }
    .tabIcon {
      font-size: 25px;
    }
    @media only screen and (max-width: 430px) {
      bottom: 0px;
    }
  }
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* div::-webkit-scrollbar-thumb {
    border-radius: 3px !important;
    background: ${({ theme }) => theme.scrollbar.thumb} !important;
  }
  div::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.scrollbar.track} !important;
  }
  div::-webkit-scrollbar-thumb:hover {
    border-radius: 3px !important;
    background: ${({ theme }) => theme.scrollbar.thumb} !important;
  }
  div::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background: ${({ theme }) => theme.scrollbar.track} !important;
  } */

  .booking-antd-table-tbody {
    background: ${({ theme }) => theme.background.content};
  }
`;

export const ImpersonationStyles = styled.div`
  position: fixed;
  right: 0;
  padding: 5px;
  z-index: 1000;
  background: #f4504f;
  border-radius: 6px;
  color: #fff;
  display: flex;
  align-items: center;
  .anticon {
    font-size: 18px;
  }
  .impersonation-text {
    margin-left: 8px;
  }
`;

export default PrivateLayoutWrapper;