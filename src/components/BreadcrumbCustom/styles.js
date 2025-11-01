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

export const BreadcrumbWrapper = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
  margin-bottom: 20px;

  .breadcrumb-item {
    &__name {
      font-weight: 600;
      font-size: 16px;
      line-height: 22px;
    }
    &__link {
      cursor: pointer;
      &:hover {
        color: ${({ theme }) => theme.palette.primary} !important;
      }
    }
  }

  .antd-breadcrumb > span:last-child {
    color: ${({ theme }) => theme.palette.primary} !important;
  }
`;
