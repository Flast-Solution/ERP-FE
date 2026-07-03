
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
