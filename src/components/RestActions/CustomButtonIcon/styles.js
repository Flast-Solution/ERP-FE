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

export const CustomButtonIconWrapper = styled.div`
  .ant-btn::not(.ant-btn-dangerous) {
    color: ${({ theme }) => theme.text.primary};
  }

  .ant-btn {
    border: 0px !important;
    height: 32px !important;
    width: 32px;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    &:hover {
      background: transparent;
      transform: scale(1.1, 1.1);
      color: ${({ theme }) => theme.palette.primary} !important;
    }
    &:focus {
      background: transparent;
      transform: scale(1.1, 1.1);
      color: ${({ theme }) => theme.palette.primary} !important;
    }
    .anticon {
      font-size: 20px;
    }
    &[disabled] > i {
      color: ${({ theme }) => theme.background.disabled};
    }
  }

  .normal-action-wrapper {
    position: relative;
  }

  .action-feature-icon {
    position: absolute;
    top: -5px;
    right: -7px;
    font-size: 18px;
    color: ${({ theme }) => theme.subscriptions.colorIcon};
  }
`;
