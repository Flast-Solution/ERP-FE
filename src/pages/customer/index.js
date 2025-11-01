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
import CustomerFilter from './Filter';
import useGetList from 'hooks/useGetList';
import { Button } from 'antd';
import { arrayEmpty, arrayNotEmpty, dateFormatOnSubmit, formatTime } from 'utils/dataUtils';
import UserService from 'services/UserService';
import { CHANNEL_SOURCE_MAP_KEYS } from 'configs/localData';
import { useNavigate } from 'react-router-dom';
import TagEditor from './TagEditor';
import RequestUtils from 'utils/RequestUtils';
import { SUCCESS_CODE } from 'configs';

const ListCustomerRetail = () => {

  const [ title ] = useState("Khách lẻ");
  let navigate = useNavigate();

  const handleTagsChange = async (record, newTags) => {
    RequestUtils.Post(`/customer/tags/save/${record.id}`, { tags: newTags });
  };

  const CUSTOM_ACTION = [
    {
      title: "Khách hàng",
      dataIndex: 'name',
      width: 150,
      ellipsis: true
    },
    {
      title: "Số điện thoại",
      dataIndex: 'mobile',
      width: 150,
      ellipsis: true
    },
    {
      title: "Email",
      dataIndex: 'email',
      width: 150,
      ellipsis: true,
      render: (email) => email || '(Chưa có)'
    },
    {
      title: "Nguồn",
      dataIndex: 'sourceId',
      width: 170,
      render: (sourceId) => CHANNEL_SOURCE_MAP_KEYS[sourceId]?.name
    },
    {
      title: "Kinh doanh",
      dataIndex: 'saleName',
      width: 150,
      ellipsis: true
    },
    {
      title: "Đ.Hàng",
      dataIndex: 'numOfOrder',
      width: 90
    },
    {
      title: "Tags",
      dataIndex: 'tags',
      width: 250,
      render: (tags, record) => (
        <TagEditor
          tags={tags || []}
          onChange={(newTags) => handleTagsChange(record, newTags)}
        />
      )
    },
    {
      title: "Ngày tạo",
      dataIndex: 'createdAt',
      width: 200,
      ellipsis: true,
      render: (createdAt) => dateFormatOnSubmit(createdAt)
    },
    {
      title: "Ngày sinh",
      dataIndex: 'dateOfBirth',
      width: 120,
      ellipsis: true,
      render: (dateOfBirth) => formatTime(dateOfBirth)
    },
    {
      title: "Giới tính",
      dataIndex: 'gender',
      width: 120,
      ellipsis: true
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      ellipsis: true,
      render: (record) => (
        <Button color="primary" variant="dashed" onClick={() => onHandleEdit(record)} size='small'>
          Chi tiết
        </Button>
      )
    }
  ];

  const onData = useCallback(async (values) => {
    if (arrayEmpty(values.embedded)) {
      return values;
    }
    let { embedded, page } = values;
    const saleIds = embedded.map(u => u.saleId);
    const mUser = await UserService.mapId2Name(saleIds);

    const customerIds = embedded.map(u => u.id);
    let { data: tags, errorCode } = await RequestUtils.Get("/customer/tags/fetch", { ids: customerIds });
    if (errorCode !== SUCCESS_CODE) {
      tags = {};
    }
    for (let item of embedded) {
      item.saleName = mUser[item.saleId] || '';
      if (arrayNotEmpty(tags[item.id])) {
        item.tags = tags[item.id].map(i => i.tag);
      } else {
        item.tags = [];
      }
    }
    return { embedded, page };
  }, []);

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onHandleEdit = ({ id }) => {
    navigate(String("/customer/").concat(id));
  }

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
        filter={<CustomerFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        hasCreate={false}
        apiPath={'customer/fetch-customer-personal'}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default ListCustomerRetail
