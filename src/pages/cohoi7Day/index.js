/**************************************************************************/
/*  index.js                                                           		*/
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

import React, { useCallback } from 'react';
import { Button } from 'antd';
import { Helmet } from 'react-helmet';
import { RestList, BreadcrumbCustom } from '@flast-erp/core/components';
import { useGetList } from "@flast-erp/core/hooks";
import { HASH_MODAL } from '@/configs';
import { InAppEvent } from '@flast-erp/core/utils';
import { cloneDeep } from 'lodash';
import { dateFormatOnSubmit } from '@flast-erp/core/utils';
import { ORDER_COLUMN_ACTION } from '@/containers/Order/utils';
import Filter from './Filter';
import OrderService from '@/services/OrderService';

const OPPORTUNITY_HIDDEN_COLUMN_KEYS = new Set([
  'opportunityAt',
  'customerAddress',
  'priceOff',
  'shippingCost',
  'paid',
  'remainingAmount',
]);

export const CoHoi7DayContent = ({ type }) => {
  const onEdit = (item) => {
    let title = 'Cập nhật mã Cơ hội / Đơn hàng #' + item.code
    let hash = '#draw/cohoi7Day.edit';
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const baseColumns = type === 'cohoi'
    ? ORDER_COLUMN_ACTION.filter(column => !OPPORTUNITY_HIDDEN_COLUMN_KEYS.has(column.key))
    : ORDER_COLUMN_ACTION;

  const CUSTOM_ACTION = [
    ...baseColumns,
    {
      title: 'Action',
      fixed: 'right',
      width: 100,
      render: (record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onEdit(record)}
        >
          Cập nhật
        </Button>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (response) => {
    return OrderService.viewInTable(response);
  }, []);

  return (
    <RestList
      xScroll={1200}
      onData={onData}
      initialFilter={{ limit: 10, page: 1, type }}
      filter={<Filter />}
      beforeSubmitFilter={beforeSubmitFilter}
      useGetAllQuery={useGetList}
      hasCreate={false}
      apiPath={'cs/co-hoi-order-fetch'}
      columns={CUSTOM_ACTION}
    />
  )
}

const CoHoi7DayPage = ({ type }) => {
  const title = type === 'cohoi'
    ? 'Danh sách Cơ hội 7 ngày chưa ra đơn hàng'
    : 'Đơn hàng chưa chăm sóc sau bán';

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title }]}
      />
      <CoHoi7DayContent type={type} />
    </div>
  )
}

export default CoHoi7DayPage
