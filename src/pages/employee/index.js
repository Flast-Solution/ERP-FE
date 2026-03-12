import React, { useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import EmployeeFilter from './EmployeeFilter';
import { Button } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { HASH_MODAL } from 'configs';

const Employee = () => {

  const onEdit = (item) => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/user.edit',
    title: 'Sửa tài khoản # ' + item.id,
    data: item
  });

  const onCreateUser = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/user.edit',
    title: 'Tạo mới tài khoản',
    data: {}
  });

  const [title] = useState("Tài khoản");
  const CUSTOM_ACTION = [
    {
      title: "Id",
      dataIndex: 'id',
      width: 100
    },
    {
      title: "Code",
      dataIndex: 'idUser',
      width: 100
    },
    {
      title: "Employee Name",
      dataIndex: 'fullName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Phone Number",
      dataIndex: 'phone',
      width: 200,
      ellipsis: true
    },
    {
      title: "Email",
      dataIndex: 'email',
      width: 200
    },
    {
      title: "Account",
      dataIndex: 'ssoId',
      width: 150,
      ellipsis: true
    },
    {
      title: "Status",
      dataIndex: 'status',
      ellipsis: true,
      render: (status) => status === 0 ? '(Nghỉ việc (Quit))' : 'Đang làm việc (Working)'
    },
    {
      title: "",
      width: 80,
      fixed: 'right',
      render: (record) => (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <Button onClick={() => onEdit(record)} size='small' color="primary" variant="dashed">Chi tiết</Button>
        </div>
      )
    }
  ];

  return (
    <div className='my__content'>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Home' }, { title: title }]}
      />
      <RestList
        xScroll={1200}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<EmployeeFilter />}
        useGetAllQuery={useGetList}
        apiPath={'user/fetch-user-department'}
        customClickCreate={onCreateUser}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default Employee;