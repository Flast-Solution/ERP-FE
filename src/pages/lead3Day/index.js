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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { RestList, BreadcrumbCustom } from '@flast-erp/core/components';
import LeadFilter from './LeadFilter';
import { useGetList } from "@flast-erp/core/hooks";
import { Button, Tag } from 'antd';
import { dateFormatOnSubmit } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs';
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { cloneDeep } from 'lodash';
import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData';
import { getLeadStatusOption, mergeLeadStatusOptions } from '@/pages/lead/leadStatusOptions';

export const Lead3DayContent = () => {
  const [services, setServices] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);

  useEffect(() => {
    RequestUtils.GetAsList('/service/list')
      .then(items => setServices(Array.isArray(items) ? items : []))
      .catch(() => setServices([]));
    RequestUtils.GetAsList('/entity-status/list-by-type', { type: 'LEAD' })
      .then(setLeadStatuses)
      .catch(() => setLeadStatuses([]));
  }, []);

  const statusOptions = useMemo(
    () => mergeLeadStatusOptions(leadStatuses),
    [leadStatuses],
  );
  const serviceNameById = useMemo(
    () => new Map(services.map(service => [String(service.id), service.name])),
    [services],
  );

  const onEdit = (item) => {
    let title = 'Cập nhật tương tác khách hàng# ' + item.id;
    let hash = '#draw/lead3day.edit';
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const CUSTOM_ACTION = [
    {
      title: "K.Hàng",
      dataIndex: 'customerName',
      width: 150,
      ellipsis: true
    },
    {
      title: "Số đ/t",
      dataIndex: 'customerMobile',
      width: 150,
      ellipsis: true
    },
    {
      title: "Dịch vụ",
      dataIndex: 'serviceId',
      width: 100,
      ellipsis: true,
      render: (serviceId) => serviceNameById.get(String(serviceId)) || '-'
    },
    {
      title: "Nguồn",
      dataIndex: 'source',
      width: 170,
      render: (sourceId) => CHANNEL_SOURCE_MAP_KEYS[sourceId]?.name
    },
    {
      title: "S.Phẩm",
      dataIndex: 'productNames',
      width: 100,
      ellipsis: true,
      render: (productNames) => (
        Array.isArray(productNames) && productNames.length > 0
          ? productNames.join(', ')
          : '-'
      )
    },
    {
      title: "Trạng thái",
      dataIndex: 'status',
      width: 100,
      ellipsis: true,
      render: (status) => {
        const statusItem = getLeadStatusOption(status, leadStatuses);
        return statusItem
          ? <Tag color={statusItem.color || undefined}>{statusItem.name}</Tag>
          : '-';
      }
    },
    {
      title: "K.Doanh",
      dataIndex: 'assignTo',
      width: 120,
      ellipsis: true
    },
    {
      title: "Ngày",
      dataIndex: 'inTime',
      width: 120,
      ellipsis: true,
      render: (inTime) => dateFormatOnSubmit(inTime)
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      render: (record) => (
        <Button color="primary" variant="dashed" onClick={() => onEdit(record)} size='small'>
          Cập nhật
        </Button>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  return (
    <RestList
      xScroll={1200}
      initialFilter={{ limit: 10, page: 1 }}
      filter={<LeadFilter statusOptions={statusOptions} />}
      beforeSubmitFilter={beforeSubmitFilter}
      useGetAllQuery={useGetList}
      hasCreate={false}
      apiPath={'cs/3day-fetch'}
      columns={CUSTOM_ACTION}
    />
  )
}

const Lead3DayPage = () => {
  const title = 'Khách hàng 3 ngày chưa ra cơ hội bán hàng'

  return (
    <div>
      <Helmet><title>{title}</title></Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title }]} />
      <Lead3DayContent />
    </div>
  )
}

export default Lead3DayPage
