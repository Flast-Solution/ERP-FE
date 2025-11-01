/**************************************************************************/
/*  style.js                                                              */
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

export const LayoutWrapper = styled.div`
    width: 100%;
    height: 400px;
    padding: 15px;
    overflow: hidden;
    background-image: url(/img/bg_bang_top_revenue.png);
    background-repeat: no-repeat;
    background-size: 100% 100%;

    .main__no__over {
        width: 100%;
        height: 99%;
        padding: 0 15px 45px;
        overflow: auto;
    }
    .ct_sale {
        color: #fff;
        border-radius: 15px;
        background: #50beb3;
        padding: 5px 0;
        margin-top: 22px;
    }
`