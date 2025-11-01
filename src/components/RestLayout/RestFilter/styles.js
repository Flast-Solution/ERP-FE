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

const RestFilterStyles = styled.div`
  margin-bottom: 10px;
  .ant-form-item {
    margin-bottom: 10px !important;
  }
  .row-filter {
    .ant-form-item-control-input-content > input,
    .ant-select-selector,
    .ant-picker {
      border: 1px solid transparent;
      ${'' /* background: #EDF1F6;  */}
      :hover, :focus {
        border: 1px solid ${({ theme }) => theme.palette.primary};
      }
    }
    .ant-form-item-label {
      display: none;
    }
    .ant-input-number,
    .ant-picker {
      width: 100%;
    }
    .ant-select-selection__rendered {
      height: 32px;
    }
    .ant-form-item-control {
      line-height: 32px;
    }
  }
  .clearButton {
    background: ${({ theme }) => theme.background.content};
    color: ${({ theme }) => theme.palette.primary};
    border: 1px solid ${({ theme }) => theme.palette.primary};
    box-sizing: border-box;
  }
  .row-action-bottom {
    display: flex;
    button {
      width: 50%;
      margin-bottom: 10px;
    }
    .filterButton {
      margin-right: 16px;
    }
  }
  .col-export-excel {
    text-align: right;
    .ant-btn {
      border-color: transparent !important;
    }
    .anticon {
      font-size: 22px;
    }
  }
`;

export default RestFilterStyles;
