/**************************************************************************/
/*  index.js                                                              */
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

import { useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { convertObjToSearchStr, getQueryParamsFromUrl } from 'utils/tools';
import ListLayout from './ListLayout';
import RestFilter from '../RestFilter';
import { useUpdateEffect } from 'hooks/MyHooks';
import { isEmpty } from 'lodash';

const log = (k, v) => console.log('[component.RestLayout.RestList] ' + k, v);
const RestList = ({
  onData = (values) => values,
  beforeSubmitFilter = (values) => values,
  filter,
  columns,
  apiPath = '',
  useGetAllQuery,
  initialFilter,
  tabKey,
  resource,
  hasCreate = true,
  tabProps = 'model',
  ...props
}) => {

  let location = useLocation();
  let navigate = useNavigate();

  const onSetTableFilter = (filter) => {
    log('table filter', filter);
  };

  const [defaultQueryParams] = useState(getQueryParamsFromUrl(location.search));
  const [queryParams, setQueryParams] = useState({
    ...initialFilter,
    ...defaultQueryParams,
    apiPath,
    resource
  });

  useUpdateEffect(() => {
    if (!isEmpty(initialFilter)) {
      setQueryParams(pre => ({ ...pre, ...initialFilter }));
    }
  }, []);

  const { data, loading } = useGetAllQuery({ queryParams, onData });
  const handleChangeQueryParams = (params) => {
    const restQueryParams = {
      ...queryParams,
      ...params
    };
    setQueryParams(restQueryParams);
    const { apiPath, ...urlParams } = restQueryParams;
    navigate({ search: convertObjToSearchStr(urlParams) });
  };

  const onSubmitFilter = (values) => {
    handleChangeQueryParams({ resource, page: 1, ...beforeSubmitFilter(values) });
  };

  const onClearFilter = () => {
    const initFilter = { apiPath: queryParams.apiPath, resource, page: 1, limit: 10 };
    setQueryParams(initFilter);
    const { apiPath, ...params } = initFilter;
    navigate({ search: convertObjToSearchStr(params) });
  };

  return (
    <div>
      {filter &&
        <RestFilter
          onSubmitFilter={onSubmitFilter}
          onClearFilter={onClearFilter}
          defaultQueryParams={defaultQueryParams}
        >
          {filter}
        </RestFilter>
      }
      <ListLayout
        resource={resource}
        queryParams={queryParams}
        handleChangeQueryParams={handleChangeQueryParams}
        columns={columns}
        hasCreate={hasCreate}
        data={data?.embedded || []}
        totalItems={data?.page?.totalElements ?? 0}
        loading={loading}
        setTableFilter={onSetTableFilter}
        {...props}
      />
    </div>
  );
};

export default RestList;
