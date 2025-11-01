
/**************************************************************************/
/*  FormAutoCompleteInfinite.js                                           */
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

import { useContext, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import useInfinite from 'hooks/useInfinite';
import { FormContextCustom } from 'components/context/FormContextCustom';
import FormAutoComplete from '../FormAutoComplete';

const FormAutoCompleteInfinite = ({
  useGetAllQuery,
  initialFilter,
  searchKey = 'q',
  filterField = 'id',
  customValue,
  ...props
}) => {

  const { record } = useContext(FormContextCustom);
  const defaultValue = useMemo(
    () => customValue || get(record, props.name),
    /* eslint-disable-next-line */
    [record]);

  const { onSearch, fetchMoreDefaultValue, loading, resourceData } = useInfinite({
    initialFilter,
    useGetAllQuery,
    searchKey
  });

  useEffect(() => {
    if (defaultValue) {
      fetchMoreDefaultValue(filterField, defaultValue);
    }
    /* eslint-disable-next-line */
  }, [defaultValue]);

  return (
    <FormAutoComplete
      loading={loading}
      resourceData={resourceData}
      onSearch={debounce(onSearch, 600)}
      isFilterOption={false}
      {...props}
    />
  );
};

export default FormAutoCompleteInfinite;
