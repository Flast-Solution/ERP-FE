import React, { useCallback, useEffect, useState } from 'react';
import RestList from "components/RestLayout/RestList";
import useGetList from "hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import Filter from './Filter';
import { Button, Flex, Typography } from 'antd';
import { InAppEvent } from "utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import { arrayEmpty, dateFormatOnSubmit, formatTime, formatMoney, arrayNotEmpty } from 'utils/dataUtils';
import useGetMe from 'hooks/useGetMe';
import {
  APP_FOLLOW_STATUS_CONFIRM,
  APP_STATUS_TEXT,
  APP_FOLLOW_STATUS_WAITING,
  APP_FOLLOW_STATUS_DONE,
  APP_FOLLOW_STATUS_REJECT
} from 'configs/constant';
import { OTContent } from './styles';
import { formatDateDayjs } from 'utils/textUtils';
import UserService from 'services/UserService';
import HotelService from 'services/HotelService';
import RequestUtils from 'utils/RequestUtils';
import { DownloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;
const Hotel = () => {

  const { isLeader, isManager } = useGetMe();
  const showPreviewOnly = isLeader() || isManager();

  useEffect(() => {
    HotelService.fetch();
    return () => HotelService.empty();
  }, []);

  const textBtn = useCallback((item) => {
    let text = "Xem thêm";
    if (isLeader() || isManager()) {
      const status = item.status;
      if (status === APP_FOLLOW_STATUS_WAITING) {
        text = "N.Check";
      } else if (status === APP_FOLLOW_STATUS_CONFIRM) {
        text = "Checked";
      } else if (status === APP_FOLLOW_STATUS_DONE) {
        text = "Confirm";
      } else if (status === APP_FOLLOW_STATUS_REJECT) {
        text = "Cancel";
      }
    }
    return text;
  }, [isLeader, isManager]);

  const onEdit = (item) => {
    let title = 'Sửa đăng ký nhà nghỉ , khách sạn # ' + item.id;
    let hash = '#draw/booking.hotel.edit';
    let lItem = item;
    if (showPreviewOnly) {
      title = 'Duyệt đăng ký nhà nghỉ , khách sạn # ' + item.id;
      hash = '#draw/booking.hotel.confirm';
      const { id, bookingList, note, infoHotel, status, createdAt, userId, userIdcheck, userIdappoved, userCreate } = item;
      lItem = { id, bookingList, ...infoHotel, note, status, createdAt, userId, userIdcheck, userIdappoved, userCreate }
    }
    InAppEvent.emit(HASH_MODAL, { hash, title, data: { ...lItem, pService: '/tickes-hotel' } });
  }

  const onExport = (item) => {
    RequestUtils.downloadFile('/tickes-hotel/export-excel', item, 'bookingHotel')
  }

  const onCreate = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/booking.hotel.edit',
    title: 'Tạo mới đăng ký nhà nghỉ , khách sạn',
    data: { createdAt: new Date() }
  });

  const [title] = useState("Đăng ký đặt nhà nghỉ , khách sạn");
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
      title: "Content",
      dataIndex: 'bookingList',
      width: 400,
      ellipsis: true,
      render: (listRegis) => <RenderPeopleItem listRegis={listRegis} />
    },
    {
      title: "Price",
      dataIndex: 'bookingList',
      width: 150,
      ellipsis: true,
      render: (lists) => formatMoney(lists?.filter(Boolean).map(item => item?.estimatePrice || 0).reduce((sum, num) => sum + num, 0))
    },
    {
      title: "Status",
      width: 100,
      ellipsis: true,
      render: (item) => APP_STATUS_TEXT.find(i => i.id === item.status)?.name ?? '(Unknow)'
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
        return item?.bookingList?.map(child => child.userId).filter(arrayNotEmpty);
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
        apiPath={'tickes-hotel/fetch'}
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
  const regis = filteredRegis[0];
  const numItems = filteredRegis.length;
  return (
    <OTContent>
      <Typography>
        <Paragraph >
          <Text>{regis?.name}</Text>
        </Paragraph>
        <Paragraph >
          <Text>Đơn giá (dự tính) Estimate price: {formatMoney(regis?.estimatePrice)}</Text>
        </Paragraph>
        <Paragraph >
          <Text strong>
            Check In {formatDateDayjs(regis?.checkIn, "MM-DD HH:mm")}, Check Out {formatDateDayjs(regis?.checkOut, "MM-DD HH:mm")}
          </Text>
          {numItems > 1 &&
            <span> ...</span>
          }
        </Paragraph>
      </Typography>
    </OTContent>
  )
}

export default Hotel;