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

export const TableStyle = styled.div`
  border: 1px solid #ddd; 
  padding: 20px; 
  border-radius: 5px;
  .table-bordered {
    width: 100%;
    border: 1px solid #ddd;
  }
  .btn_success {
    color: #fff;
    background-color: #5cb85c;
    border-color: #4cae4c;
  }
  .btn-warning {
    margin-left: 10px;
    color: #fff;
    background-color: #f0ad4e;
    border-color: #eea236;
  }
  .btn-blur {
    color: #fff;
    background-color: #5bc0de;
    border-color: #46b8da;
  }
  .table-bordered > tbody > tr > td {
    border-right: 1px solid #ddd;
    padding: 10px;
  }
  .btn-primary {
    color: #fff;
    background-color: #337ab7;
    border-color: #2e6da4;
    margin-top: 3px;
  }
`

export const FormPriceStyle = styled.div`
  .form-list__list-item .ant-form-item {
    margin-bottom: 0px !important;
  }
`

export const SKUContent = styled.div`
  .ant-typography {
    margin-bottom: 0px;
  }
`

export const FormListFile = styled.div`
  .selectedImage {
    position: relative;
    max-height: 100%;
    .overlay {
      position: absolute;
      inset: 0px 5px 0px 0px;
      min-width: 100px;
      width: 100px;
      height: 100px;
      display: flex;
      z-index: 2;
      -webkit-box-align: center;
      align-items: center;
      -webkit-box-pack: center;
      justify-content: center;
      border-radius: 4px;
      cursor: not-allowed;
      background: rgba(0, 0, 0, 0.3);
      visibility: hidden;
      .anticon-eye,
      .anticon-delete {
        color: #fff;
        font-size: 24px;
        margin: 2px;
        cursor: pointer;
      }
    }
  }
  .upload-image-wrapper {
    display: inline-flex;
    flex-wrap: wrap;
    -webkit-box-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    align-items: center;
    .uploadImage {
      margin: 5px;
      position: relative;
      &:hover .overlay {
        visibility: visible;
      }
      img {
        border: 1px solid #ffc016;
        min-width: 100px;
        width: 100px;
        height: 100px;
        border-radius: 4px;
        object-fit: cover;
      }
      .lbSetDefault {
        color: white;
        background: rgb(85, 85, 81);
        position: absolute;
        bottom: 0px;
        left: 0px;
        right: 0px;
        z-index: 2;
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
        cursor: pointer;
         &:hover {
          background:#ffc016;
        }
      }
      .active {
        visibility: visible;
        background: #ffc016;
      }
    }
  }
`
