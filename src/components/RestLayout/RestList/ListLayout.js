/**************************************************************************/
/*  ListLayout.js                                                         */
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

import { useCallback } from 'react';
import { Pagination, Table, Space } from 'antd';
import ListLayoutStyles from './styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { HASH_MODAL } from 'configs';
import CreateButton from 'components/RestActions/CreateButton';

const ListLayout = ({
  columns,
  data,
  xScroll,
  pagination = {},
  rowKey = 'id',
  hasCreate = true,
  handleChangeQueryParams = () => null,
  resource,
  queryParams,
  totalItems,
  setTableFilter,
  customClickCreate,
  customActions,
  expandable,
  ...props
}) => {

  const location = useLocation();
  const navigate = useNavigate();
  const showTotal = useCallback(
    (total, range) => `${range[0]}-${range[1]}/${total}`,
    [],
  );

  const onChangeTable = (pagination, filters, sorter) => {
    setTableFilter(filters);
    handleChangeQueryParams(filters);
  };

  const paginationResult = {
    total: totalItems || 0,
    pageSize: queryParams?.limit || 10,
    current: queryParams?.page || 1,
    showSizeChanger: true,
    showQuickJumper: false,
    showTotal,
    ...pagination,
  };

  const onChangePagination = (page, pageSize) => {
    handleChangeQueryParams({
      page,
      limit: pageSize,
    });
  };

  const handleClickCreate = () => {
    if (customClickCreate) {
      customClickCreate();
    } else {
      navigate({ search: location.search, hash: `${HASH_MODAL}/${resource}/create` });
    }
  };

  return (
    <ListLayoutStyles>
      <div className="list-layout__pagination-top">
        <Pagination {...paginationResult} onChange={onChangePagination} />
        <div className="list-layout__group-action">
          { /* Đoạn này đang tạm bỏ */}
          <Space size={10}>
            {customActions}
            {hasCreate && (
              <CreateButton
                handleClick={handleClickCreate}
              />
            )}
          </Space>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        rowKey={rowKey}
        scroll={{ x: xScroll || 1700 }}
        expandable={expandable}
        onChange={onChangeTable}
        {...props}
      />
      <div className="list-layout__pagination-bottom">
        <Pagination {...paginationResult} onChange={onChangePagination} />
      </div>
    </ListLayoutStyles>
  );
};

export default ListLayout;
