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

const PublicLayoutWrapper = styled.div`
  .layout {
    min-height: 100vh;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    padding: 24px;
    background-color: white;
    @media only screen and (max-width: 920px) {
      display: block;
    }
  }

  .auth-service-layout {
    &__logo {
      width: 386.15px;
      @media only screen and (max-width: 480px) {
        width: 100%;
      }
    }
    &__content {
      margin-top: 130px;
      @media only screen and (max-height: 880px) {
        margin-top: auto;
      }
    }
    &__title-wrapper {
      margin-bottom: 76px;
      @media only screen and (max-width: 920px), (max-height: 700px) {
        margin-top: 50px;
      }
    }
    &__main-title {
      font-size: 48px;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 16px;
      color: ${({ theme }) => theme.color.deepCove};
    }
    &__min-title {
      font-size: 24px;
      font-weight: 700;
      color: ${({ theme }) => theme.color.deepCove};
      line-height: 1;
    }
    &__icon-success {
      color: ${({ theme }) => theme.color.green};
      font-size: 60px;
      margin: auto;
    }
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  .forgot-password {
    font-size: 14px;
    font-weight: 500;
  }
  .btn-auth {
    margin-top: 30px;
    button {
      font-weight: 700;
    }
    @media only screen and (max-width: 920px), (max-height: 600px) {
      margin-top: 50px;
    }
  }
  .main-img {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: white;
    background-position: bottom right;
    background-repeat: no-repeat;
    height: 100%;
    @media only screen and (max-width: 920px) {
      display: none;
    }
    #logo {
      position: absolute;
      top: 4.09836066%;
      left: 6.80555556%;
    }
    #content {
      width: 100%;
      max-width: 637px;
    }
    #intro {
      position: absolute;
      bottom: 6.96721311%;
      right: 9.02777778%;
      width: 73.1944444%;
      max-width: calc(100% - 65px);
      padding-left: 15px;
    }
  }

  .main-content {
    background-color: white;
    padding: 32px 75px;
    text-align: left;
    display: flex;
    flex-direction: column;
    @media only screen and (max-width: 920px) {
      padding: 0;
      width: 100%;
    }
    @media only screen and (max-height: 600px) {
      padding-top: 0;
    }
  }
  .ant-form-item-children {
    display: block;
  }
  .ant-divider-horizontal.ant-divider-with-text {
    color: #e8e8e8;
  }
  .ant-divider {
    color: #e8e8e8;
  }
  .ant-input-prefix {
    margin-right: 8px;
  }
  .ant-form-item-label {
    padding-bottom: 3px;
    label {
      font-size: 16px;
      font-weight: bold;
      color: ${({ theme }) => theme.color.deepCove};
      line-height: 24px;

      &::after {
        display: none !important;
      }
    }
  }
  .ant-form-item-control-input-content {
    input {
      color: ${({ theme }) => theme.color.deepCove};
      padding: 12px 16px;

      &::placeholder {
        color: ${({ theme }) => theme.text.grey3};
      }
    }
  }
  .ant-row {
    &:nth-child(2) {
      margin-bottom: 16px;
    }
  }
  .ant-input-affix-wrapper-lg {
    padding: 12px 16px;

    input {
      padding: 0;
    }
  }
  @media only screen and (max-width: 576px), (max-height: 600px) {
    .auth-service-layout {
      &__main-title {
        font-size: 30px;
      }
      &__min-title {
        font-size: 12px;
      }
    }
  }
`;

export default PublicLayoutWrapper;
