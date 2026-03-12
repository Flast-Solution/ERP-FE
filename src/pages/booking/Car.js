import React, { useCallback, useEffect, useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import Filter from './Filter';
import { Button, Flex, Typography } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import { arrayEmpty, arrayNotEmpty, dateFormatOnSubmit, formatTime, formatMoney } from 'utils/dataUtils';
import useGetMe from 'hooks/useGetMe';
import {
  APP_FOLLOW_STATUS_CONFIRM,
  APP_STATUS_TEXT,
  APP_FOLLOW_STATUS_WAITING,
  APP_FOLLOW_STATUS_DONE,
  APP_FOLLOW_STATUS_REJECT
} from 'configs/constant';
import { OTContent } from './styles';
import UserService from 'services/UserService';
import { CAR_WORK_TYPE } from 'configs/localData';
import CarService from 'services/CarService';
import RequestUtils from 'utils/RequestUtils';
import { DownloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;
const Car = () => {

  const { isLeader, isManager } = useGetMe();
  const showPreviewOnly = isLeader() || isManager();

  useEffect(() => {
    CarService.fetch();
    return () => CarService.empty();
  }, [])

  const textBtn = useCallback((item) => {
    console.log(item)
    let text = "Xem đơn";
    if (isLeader() || isManager()) {
      const reEditStatus = item?.overTimeReality?.status ?? -1;
      const status = item.status;
      if (status === APP_FOLLOW_STATUS_WAITING || reEditStatus === APP_FOLLOW_STATUS_WAITING) {
        text = "N.Check";
      } else if (status === APP_FOLLOW_STATUS_CONFIRM || reEditStatus === APP_FOLLOW_STATUS_CONFIRM) {
        text = "Checked";
      } else if (status === APP_FOLLOW_STATUS_DONE || reEditStatus === APP_FOLLOW_STATUS_DONE) {
        text = "Confirm";
      } else if (status === APP_FOLLOW_STATUS_REJECT || reEditStatus === APP_FOLLOW_STATUS_REJECT) {
        text = "Cancel";
      }
    }
    return text;
  }, [isLeader, isManager]);

  const onEdit = (item) => {
    let title = 'Sửa đăng ký xe # ' + item.id;
    let hash = '#draw/booking.car.edit';
    if (showPreviewOnly) {
      title = 'Duyệt đăng ký xe # ' + item.id;
      hash = '#draw/booking.car.confirm';
    }
    InAppEvent.emit(HASH_MODAL, { hash, title, data: { ...item, pService: '/tickes-bus' } });
  }

  const onExport = (item) => {
    RequestUtils.downloadFile('/tickes-bus/export-excel', item, 'bookingCar')
  }

  const onCreate = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/booking.car.edit',
    title: 'Tạo mới đăng ký xe',
    data: { createdAt: new Date() }
  });

  const [title] = useState("Đăng ký đặt xe ô tô");
  const CUSTOM_ACTION = [
    {
      title: "Id",
      dataIndex: 'id',
      width: 100
    },
    {
      title: "Employe",
      dataIndex: 'userCreate',
      width: 150,
      ellipsis: true
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
      title: "Staff / Guest",
      dataIndex: 'scheduleBusList',
      width: 400,
      ellipsis: true,
      render: (listRegis) => <RenderPeopleItem listRegis={listRegis} />
    },
    {
      title: "Price",
      dataIndex: 'scheduleBusList',
      width: 150,
      ellipsis: true,
      render: (lists) => formatMoney(lists?.filter(Boolean).map(item => item?.price || 0).reduce((sum, num) => sum + num, 0))
    },
    {
      title: "Status",
      width: 100,
      ellipsis: true,
      render: (item) => APP_STATUS_TEXT.find(i => i.id === (item?.overTimeReality?.status ?? item.status))?.name ?? '(Unknow)'
    },
    {
      title: "Created",
      dataIndex: 'createdAt',
      width: 120,
      ellipsis: true,
      render: (createdAt) => formatTime(createdAt)
    },
    {
      title: "",
      width: 100,
      fixed: 'right',
      render: (record) => (
        <Flex gap={'small'}>
          <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>{textBtn(record)}</Button>
          {record.status == APP_FOLLOW_STATUS_DONE && <Button color="primary" variant="solid" onClick={() => onExport(record)} size='small'>{<DownloadOutlined />}</Button>
          }
        </Flex>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onLoadData = useCallback(async (values) => {
    if (arrayNotEmpty(values.embedded)) {
      let uIds = values.embedded.map(item => {
        return item?.scheduleBusList?.map(child => child.userId).filter(arrayNotEmpty);
      }).filter(arrayNotEmpty);
      let ids = [];
      for (let arr of uIds) {
        for (let id of arr[0]) {
          ids.push(id);
        }
      }
      await UserService.loadByIds(ids);
    }
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
        onData={onLoadData}
        apiPath={'tickes-bus/fetch'}
        customClickCreate={onCreate}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

const RenderPeopleItem = ({ listRegis }) => {
  const filteredRegis = listRegis?.filter(Boolean) || [];
  if (filteredRegis.length === 0) {
    return '(No Content)';
  }
  const numRecord = filteredRegis.length;
  let firstItem = filteredRegis.filter(f => arrayNotEmpty(f?.userId)).pop() ?? filteredRegis[0];
  if (arrayEmpty(firstItem?.userId)) {
    firstItem = filteredRegis.filter(f => arrayEmpty(f?.userId)).pop() ?? filteredRegis[0];
  }
  return (
    <OTContent>
      <Typography>
        <Paragraph >
          <Text>{firstItem?.status === CAR_WORK_TYPE ? 'Đi công tác' : 'Không công tác'}</Text>
        </Paragraph>
        <Paragraph >
          <Text strong type={firstItem?.status === CAR_WORK_TYPE ? "warning" : "success"}>
            {arrayNotEmpty(firstItem?.userId)
              ? <span> {firstItem?.userId?.map((id) => UserService.fetchNameById(id)).join(", ")}</span>
              : (
                firstItem?.nameGuest
                  ?
                  <span>Khách hàng/ Guest: {firstItem?.nameGuest}
                    {firstItem?.companyGuest ? (' - ' + firstItem?.companyGuest) : ''}
                  </span>
                  : '(empty)'
              )
            }
            {numRecord > 1 &&
              <span>...</span>
            }
          </Text>
        </Paragraph>
      </Typography>
    </OTContent>
  )
}

export default Car;