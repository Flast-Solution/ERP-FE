/**************************************************************************/
/*  formatFilters.js                                                      */
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

import forEach from 'lodash/forEach';
import last from 'lodash/last';
import head from 'lodash/head';
import { QUERY_PARAMS_PROPERTY } from 'configs/constant';

export const formatFiltersTable = (filters) => {
  const outsideFilter = {};
  const restFilters = {};
  forEach(filters, (value, key) => {
    const splitArr = key.split('.');
    const operator = last(splitArr) || 'eq';
    if (head(splitArr) === QUERY_PARAMS_PROPERTY.outsideFilter) {
      outsideFilter[splitArr.slice(1).join('.')] = value?.[0] || undefined;
    } else {
      restFilters[splitArr.slice(0, -1).join('.') || key] = {
        [operator]: value ? String(value) : undefined,
      };
    }
  });
  return { outsideFilter, filters: restFilters };
};

const formatSorter = (sorter) => {
  return sorter && sorter.field && sorter.order
    ? `${sorter.field}:${sorter.order === 'descend' ? 'DESC' : 'ASC'}:NULLS_LAST`
    : undefined;
};

export const formatSorterTable = (sorter) => {
  if (Array.isArray(sorter)) {
    return sorter.map(item => formatSorter(item)).join(',');
  } else {
    return formatSorter(sorter);
  }
};
