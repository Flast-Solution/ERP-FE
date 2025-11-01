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
import { arrayNotEmpty, dateFormatOnSubmit } from 'utils/dataUtils';
import { HASH_MODAL } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import { Button } from 'antd';
import UserService from 'services/UserService';

const ListUserGroup = () => {

  const [ title ] = useState("Danh sách tài khoản Team");
  const CUSTOM_ACTION = [
    {
      title: "Tên Team",
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: "Tên Leader",
      dataIndex: 'leaderName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Thời gian",
      dataIndex: 'inTime',
      width: 200,
      ellipsis: true,
      render: (inTime) => dateFormatOnSubmit(inTime)
    },
    {
      title: "D/s thành viên",
      dataIndex: 'members',
      width: 200,
      ellipsis: true,
      render: (members) => members?.join(", ")
    },
    {
      title: "S/L thành viên",
      dataIndex: 'memberNumber',
      width: 200,
      ellipsis: true
    },
    {
      title: "Phòng ban",
      dataIndex: 'department',
      width: 200,
      ellipsis: true,
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

  const onData = useCallback(async (values) => {
    if(arrayNotEmpty(values)) {
      const uIds = values.flatMap(item => item.listMember);
      const mUsers = await UserService.mapId2Name(uIds);
      for(let item of values) {
        item.members = item.listMember.map(i => mUsers[i] || '');
      }
    }
    return { embedded : values, page: {} };
  }, []);

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onCreateLead = () => {
    let title = 'Tạo tài khoản Group';
    let hash = '#draw/userGroup.edit';
    let data = { record: {}};
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onHandleUpdateUser = (datas) => {
    let title = 'Sửa tài khoản Group';
    let hash = '#draw/userGroup.edit';

    const { members, ...valuse } = datas;
    let data = { record: valuse };
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
        apiPath={'user-group/fetch'}
        customClickCreate={onCreateLead}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default ListUserGroup


