/**************************************************************************/
/*  styles.js                                                           	*/
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

export const ContainerStyles = styled.div`
	.react-kanban-column {
		border-radius: 8px;
		padding: 10px;
		max-width:320px;
		max-height: 100vh;
		scrollbar-width: none;
  	-ms-overflow-style: none;
		overflow-y: scroll;
	}
	.react-kanban-column ::-webkit-scrollbar {
		display: none;
	}
	.title {
		border-radius: 15px;
		padding: 6px;
		text-align: center;
		font-size: 16px;
		color: white;
	}
`;
