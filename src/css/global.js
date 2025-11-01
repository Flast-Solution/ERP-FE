/**************************************************************************/
/*  global.js                                                             */
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
import { Row, Layout } from 'antd';

export const FormListStyles = styled(Row)`
  .form-list {
    &__list-item {
      position: relative;
      padding: 15px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    &__remove-button {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 25px;
    }
  }
  .ant-col .ant-form-item {
    margin-bottom: 0px !important;
  }
`;

export const StyledHeaderInvoice = styled(Layout)`
	.logo {
		border-right: 2px solid rgb(249, 199, 39);
    height: 80px;
    align-items: center;
    display: flex;
	}
	.company {
		text-align: left;
		margin-left: 20px;
	}
	.contact {
		margin-top: 5px;
	}
	.left20 {
		margin-left: 20px;
	}
	.title {
		margin-bottom: 20px;
		color: #1890ff;
	}
  .row_padding_small .ant-table-cell {
    padding: 5px 15px;
  }
`;
