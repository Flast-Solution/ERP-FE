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

const SideBarStyles = styled.div`
  @media only screen and (min-device-width: 480px){
    .ant-layout-sider-collapsed {
      display:none;
    }
  }
  .sidebar {
    height: 100vh;
    left: 0;
    background: ${({ theme }) => theme.background.content};
    overflow-y: auto;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      border-radius: 10px;
      width: 4px;
    }
    ::-webkit-scrollbar-track {
      background: transparent !important;
      box-shadow: none !important;
    }
    ::-webkit-scrollbar-thumb {
      background: transparent !important;
    }

    &:hover {
      ::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.scrollbar.thumb} !important;
      }
    }
    .ant-menu {
      background: ${({ theme }) => theme.background.content};
    }
    .ant-menu-inline-collapsed > .ant-menu-item .anticon {
      line-height: 0;
    }
    .ant-menu-vertical {
      border-right: 0px;
    }
    .ant-menu-inline {
      border-right: 0px;
    }
    .ant-menu-submenu-title {
      padding-left: 18px;
    }
    .ant-menu-inline .ant-menu-item {
      padding: 0 20px !important;
      width: 100%;
    }

    .ant-menu-vertical .ant-menu-item::after,
    .ant-menu-vertical-left .ant-menu-item::after,
    .ant-menu-vertical-right .ant-menu-item::after,
    .ant-menu-inline .ant-menu-item::after {
      content: none;
    }

    .ant-menu-vertical .ant-menu-item::before,
    .ant-menu-vertical-left .ant-menu-item::before,
    .ant-menu-vertical-right .ant-menu-item::before,
    .ant-menu-inline .ant-menu-item::before {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      border-right: 3px solid ${({ theme }) => theme.palette.primary};
      transform: scaleY(0.0001);
      opacity: 0;
      content: '';
    }

    .ant-menu-vertical .ant-menu-selected::before,
    .ant-menu-vertical .ant-menu-item-selected::before,
    .ant-menu-inline .ant-menu-selected::before,
    .ant-menu-inline .ant-menu-item-selected::before {
      opacity: 1;
      transform: scaleY(1);
    }
    .ant-menu-submenu {
      font-size: 14px;
      color: #425466;
      font-weight: 600;
    }
    .ant-menu-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      .anticon {
        font-size: 16px;
      }
      .menu-label {
        flex: 1;
        display: flex;
        justify-content: space-between;
        overflow: hidden;
        &__name {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        &__count {
          font-size: 12px;
          line-height: 12px;
          padding: 2px 8px;
          color: ${({ theme }) => theme.color.infoDefault};
          background: ${({ theme }) => `${theme.color.infoDefault}20`};
          border-radius: 6px;
        }
      }

      &.ant-menu-item-selected {
        background-color: #fff;
        color: ${({ theme }) => theme.palette.primary};
        .anticon {
          color: ${({ theme }) => theme.palette.primary};
        }
        .menu-label {
          &__count {
            color: ${({ theme }) => theme.palette.primary};
            background: ${({ theme }) => `${theme.palette.primary}20`};
          }
        }
      }

      .ant-badge {
        .ant-badge-count {
          top: 0px;
          left: -10px;
          right: auto;
        }
        &.ant-menu-item-icon {
          margin-right: 0;
        }
        .feature-icon {
          opacity: 1;
        }
      }
    }
  }
  .ant-layout-sider-collapsed {
    .ant-menu-title-content {
      margin-left: 0 !important;
    }
    .ant-menu-item {
      justify-content: center;
      .ant-badge {
        .ant-badge-count {
          top: 7px;
          left: -30px;
        }
        .feature-icon {
          top: 0px;
          color: ${({ theme }) => theme.subscriptions.colorIcon};
        }
      }
    }
    .logo {
      padding-left: 0px;
      justify-content: center;
      object-fit: contain;
    }
  }
`;

export default SideBarStyles;
