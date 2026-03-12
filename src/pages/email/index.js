import React from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import { InAppEvent } from "utils/FuseUtils";
import { HASH_MODAL } from 'configs';

const Email = () => {

  const onEdit = (item) => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/email.edit',
    title: 'Sửa email # ' + item.id,
    data: item
  });

  const onCreate = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/email.edit',
    title: 'Tạo email mới',
    data: {}
  });

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Người nhận',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Email - Quản lý hành chính</title>
      </Helmet>
      <CustomBreadcrumb
        data={[
          { title: 'Quản lý hành chính' },
          { title: 'Email' }
        ]}
      />
      <RestList
        columns={columns}
        useGetAllQuery={useGetList}
        apiPath="email/list"
        onCreate={onCreate}
        onEdit={onEdit}
        createLabel="Tạo email"
        searchPlaceholder="Tìm kiếm email..."
      />
    </>
  );
};

export default Email;