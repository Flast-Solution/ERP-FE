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
  
    return {
      outsideFilter,
      filters: restFilters,
    };
};

const formatSorter = (sorter) => {
    return sorter && sorter.field && sorter.order
      ? `${sorter.field}:${ sorter.order === 'descend' ? 'DESC' : 'ASC' }:NULLS_LAST`
      : undefined;
};

export const formatSorterTable = (sorter) => {
    if (Array.isArray(sorter)) {
      return sorter.map(item => formatSorter(item)).join(',');
    } else {
      return formatSorter(sorter);
    }
};
