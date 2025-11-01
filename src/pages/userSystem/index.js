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
import { GATEWAY, HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import { Button, Image } from 'antd';

const ListUserSystem = () => {

  const [ title ] = useState("Danh sách tài khoản hệ thống");
  const CUSTOM_ACTION = [
    {
      title: "Tên",
      dataIndex: 'fullName',
      ellipsis: true
    },
    {
      title: "Avatar",
      dataIndex: 'avartar',
      ellipsis: true,
      render: (avartar) => (
        <Image
          preview={false}
          width={50}
          src={`${avartar ? `${GATEWAY}${avartar}` : '/img/image_not_found.png'}`}
          alt='image'
        />
      )
    },
    {
      title: "Số điện thoại",
      dataIndex: 'phone',
      ellipsis: true
    },
    {
      title: "Email",
      dataIndex: 'email',
      ellipsis: true
    },
    {
      title: "Tài khoản",
      dataIndex: 'ssoId',
      ellipsis: true
    },
    {
      title: "Role tài khoản",
      dataIndex: 'userProfiles',
      ellipsis: true,
      render: (userProfiles) => userProfiles?.map(f => f.type).join(",") || 'N/A'
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      render: (record) => (
        <Button color="primary" variant="dashed" size='small' onClick={() => onHandleUpdateUser(record)}>
          Update
        </Button>
      )
    }
  ];

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
        initialFilter={{ limit: 10, page: 1, fullName: '', ssoId: '' }}
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

export default ListUserSystem


