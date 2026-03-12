import styled from 'styled-components';
import { Row } from 'antd';

const FormStyles = styled(Row)`
  .form-list {
    &__list-item {
      position: relative;
      padding: 15px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      margin-bottom: 20px;
      > .ant-row > .ant-col > .ant-form-item {
        margin-bottom: 0px !important;
      }
    }
    &__remove-button {
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 25px;
    }
  }
`;

export default FormStyles;
