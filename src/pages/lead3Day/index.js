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

import React, { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import RestList from 'components/RestLayout/RestList';
import LeadFilter from './LeadFilter';
import useGetList from "hooks/useGetList";
import { Button, Tag } from 'antd';
import { arrayEmpty, dateFormatOnSubmit } from 'utils/dataUtils';
import { getColorStatusLead, getStatusLead } from 'configs/constant';
import { HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import { cloneDeep } from 'lodash';
import RequestUtils from 'utils/RequestUtils';
import { CHANNEL_SOURCE_MAP_KEYS } from 'configs/localData';

const Lead3DayPage = () => {

  const [title] = useState("Khách hàng 3 ngày chưa ra cơ hội bán hàng");

  const onEdit = (item) => {
    let title = 'Cập nhật tương tác khách hàng# ' + item.id;
    let hash = '#draw/lead3day.edit';
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const CUSTOM_ACTION = [
    {
      title: "N.Viên",
      dataIndex: 'staff',
      width: 150,
      ellipsis: true
    },
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
      dataIndex: 'serviceName',
      width: 100,
      ellipsis: true
    },
    {
      title: "Nguồn",
      dataIndex: 'source',
      width: 170,
      render: (sourceId) => CHANNEL_SOURCE_MAP_KEYS[sourceId]?.name
    },
    {
      title: "S.Phẩm",
      dataIndex: 'productName',
      width: 100,
      ellipsis: true
    },
    {
      title: "Trạng thái",
      dataIndex: 'status',
      width: 100,
      ellipsis: true,
      render: (status) => (
        <Tag color={getColorStatusLead(status)}>{getStatusLead(status)}</Tag>
      )
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

  const onData = useCallback(async (values) => {
    if (arrayEmpty(values.embedded)) {
      return values;
    }
    const services = await RequestUtils.GetAsList('/service/list');
    for (let item of values.embedded) {
      item.serviceName = services.find(i => i.id === item.serviceId)?.name ?? "";
    }
    return values;
  }, []);

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  return (
    <div>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <RestList
        xScroll={1200}
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<LeadFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        hasCreate={false}
        apiPath={'cs/3day-fetch'}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default Lead3DayPage
