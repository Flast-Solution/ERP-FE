import React, { useCallback, useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import Filter from './Filter';
import { Button } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import { dateFormatOnSubmit, formatTime } from 'utils/dataUtils';
import useGetMe from 'hooks/useGetMe';
import {
  NGHI_PHEP_META,
  NGHI_PHEP_STATUS_CONFIRM,
  NGHI_PHEP_STATUS_TEXT,
  NGHI_PHEP_STATUS_WAITING,
  NGHI_PHEP_STATUS_DONE,
  NGHI_PHEP_STATUS_REJECT
} from 'configs/constant';

const User = () => {

  const { isLeader, isManager } = useGetMe();
  const showPreviewOnly = isLeader() || isManager();

  const textBtn = useCallback((item) => {
    let text = "Xem đơn";
    if (isLeader() || isManager()) {
      if (item.status === NGHI_PHEP_STATUS_WAITING) {
        text = "N.Check";
      } else if (item.status === NGHI_PHEP_STATUS_CONFIRM) {
        text = "Checked";
      } else if (item.status === NGHI_PHEP_STATUS_DONE) {
        text = "Confirm";
      } else if (item.status === NGHI_PHEP_STATUS_REJECT) {
        text = "Cancel";
      }
    }
    return text;
  }, [isLeader, isManager]);

  const onEdit = (item) => {
    let title = 'Sửa đơn xin nghỉ phép # ' + item.id;
    let hash = '#draw/nghiphep.edit';
    if (showPreviewOnly) {
      title = 'Duyệt đơn xin nghỉ phép # ' + item.id;
      hash = '#draw/nghiphep.confirm';
    }
    InAppEvent.emit(HASH_MODAL, { hash, title, data: item });
  }

  const onCreateUser = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/nghiphep.edit',
    title: 'Tạo mới đơn xin nghỉ phép/Create leave application',
    data: { createdAt: new Date() }
  });

  const [title] = useState("Đơn xin nghỉ phép");
  const CUSTOM_ACTION = [
    {
      title: "Id",
      dataIndex: 'id',
      width: 100
    },
    {
      title: "Employe",
      dataIndex: 'userCreate',
      width: 120,
      ellipsis: true
    },
    {
      title: "Type",
      dataIndex: 'type',
      width: 200,
      ellipsis: true,
      render: (type) => NGHI_PHEP_META.find(i => i.id === type)?.name ?? "(Unknow)"
    },
    {
      title: "Review",
      dataIndex: 'userCheck',
      width: 150,
      ellipsis: true
    },
    {
      title: "Appoved",
      dataIndex: 'userAppoved',
      width: 150,
      ellipsis: true
    },
    {
      title: "Begin",
      dataIndex: 'startedAt',
      width: 150,
      ellipsis: true
    },
    {
      title: "End",
      dataIndex: 'endAt',
      width: 150,
      ellipsis: true
    },
    {
      title: "Created",
      dataIndex: 'createdAt',
      width: 120,
      ellipsis: true,
      render: (createdAt) => formatTime(createdAt)
    },
    {
      title: "Status",
      dataIndex: 'status',
      ellipsis: true,
      render: (status) => NGHI_PHEP_STATUS_TEXT.find(i => i.id === status)?.name ?? '(Unknow)'
    },
    {
      title: "",
      width: 100,
      fixed: 'right',
      render: (record) => (
        <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>{textBtn(record)}</Button>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

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
        filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'leave-of-absence/fetch'}
        customClickCreate={onCreateUser}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default User;