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
import LeadFilter from './Filter';
import useGetList from "hooks/useGetList";
import { dateFormatOnSubmit } from 'utils/dataUtils';
import { HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import { Button } from 'antd';

const ListUser = () => {

  const [title] = useState("Danh sách tài khoản");
  const CUSTOM_ACTION = [
    {
      title: "Hộ và tên",
      ataIndex: 'Fullname',
      width: 200,
      ellipsis: true,
      render: (item) => {
        return (
          <div>
            {item?.fullName}
          </div>
        )
      }
    },
    {
      title: "Số điện thoại",
      ataIndex: 'mobile',
      width: 200,
      ellipsis: true,
      render: (item) => {
        return (
          <div>
            {item?.phone || 'N/A'}
          </div>
        )
      }
    },
    {
      title: "Email",
      ataIndex: 'email',
      width: 200,
      ellipsis: true,
      render: (item) => {
        return (
          <div>
            {item?.email || 'N/A'}
          </div>
        )
      }
    },
    {
      title: "Địa chỉ",
      ataIndex: 'address',
      width: 200,
      ellipsis: true,
      render: (item) => {
        return (
          <div>
            {item?.address || 'N/A'}
          </div>
        )
      }
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      render: (record) => (
        <div>
          <Button color="primary" variant="dashed" size='small' onClick={() => onHandleUpdateUser(record)}>
            Update
          </Button>
        </div>
      )
    }
  ];

  const onData = useCallback((values) => {
    const newData = { embedded: values.embedded, page: { pageSize: 10, total: 1 } }
    return newData;
  }, []);

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onCreateLead = () => {
    let title = 'Tạo tài khoản';
    let hash = '#draw/userAccount.edit';
    let data = {}
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onHandleUpdateUser = (datas) => {
    let title = 'Sửa tài khoản';
    let hash = '#draw/userAccount.edit';
    let data = datas;
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
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
        filter={<LeadFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'user/list'}
        customClickCreate={onCreateLead}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default ListUser

