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

const ListLayoutStyles = styled.div`
  .list-layout {
    &__pagination-top {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 16px 0px;
    }
    &__pagination-bottom {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    &__group-action {
      flex: 1;
      > .ant-space {
        justify-content: flex-end;
        display: flex;
      }
    }
  }

  .ant-table-thead > tr:first-child > th {
    /* background: ${({ theme }) => theme.table.headerBackground}; */
    font-weight: 600;
    text-transform: uppercase;
  }
`;

export default ListLayoutStyles;
