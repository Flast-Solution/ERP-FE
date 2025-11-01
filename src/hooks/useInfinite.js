/**************************************************************************/
/*  useInfinite.js                                                        */
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

import unionBy from 'lodash/unionBy';
import { useState } from 'react';

const log = (value, key = '') => console.log('[hooks.useInfinite] ' + key, value);

const useInfinite = ({
  initialFilter = {},
  useGetAllQuery,
  searchKey = 'q',
  handleSelectedDefault
}) => {

  const [queryParams, setQueryParams] = useState(initialFilter);
  const [isSetDefaultValue, isSetSetDefaultValue] = useState(!handleSelectedDefault);
  const [currentPage, setCurrentPage] = useState(1);
  const [resourceData, setResourceData] = useState([]);

  const { loading, data, refetch, fetchMore } = useGetAllQuery({
    queryParams,
    onCompleted: res => {
      setResourceData(res?.embedded);
      if (!isSetDefaultValue) {
        isSetSetDefaultValue(true);
        handleSelectedDefault?.(res?.embedded?.[0]?.id);
      }
    }
  });

  const onLoadMore = () => {
    log('onLoadMore .!!')
    if (currentPage === data?.page?.totalPages && !loading) {
      return Promise.resolve();
    }
    return refetch({
      ...queryParams,
      page: data?.page?.currentPage + 1
    }).then(data => {
      setCurrentPage(data?.page?.currentPage);
      const mergedData = unionBy(resourceData, data?.embedded, 'id');
      setResourceData(mergedData);
    });
  };

  const enableWaypoint = !loading && data?.embedded?.length < data?.page?.pageSize;
  const onSearch = (value) => {
    if (searchKey === 'q') {
      setQueryParams({ ...queryParams, page: 1, q: value?.trim() || undefined });
    } else {
      setQueryParams({ ...queryParams, [searchKey]: value, page: 1 });
    }
  };

  const onSubmitFilter = (values) => {
    setQueryParams({ ...queryParams, page: 1, ...values });
  };

  const onClearFilter = () => {
    setQueryParams({ page: 1, limit: 10 });
  };

  const fetchMoreDefaultValue = (filterField, defaultValue) => {
    log({ filterField, defaultValue }, 'fetchMoreDefaultValue .!!')
    fetchMore({ filterField, defaultValue })?.then(data => {
      const mergedData = unionBy(resourceData, data?.embedded, 'id');
      setResourceData(mergedData);
    });
  };

  return {
    onLoadMore,
    onSearch,
    fetchMoreDefaultValue,
    onSubmitFilter,
    onClearFilter,
    enableWaypoint,
    loading,
    resourceData,
    refetch
  };
};

export default useInfinite;
