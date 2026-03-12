import React, { useCallback, useEffect, useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { arrayNotEmpty, dateFormatOnSubmit } from 'utils/dataUtils';
import { Form } from 'antd';
import { APP_FOLLOW_STATUS_WAITING } from 'configs/constant';
import { cloneDeep } from 'lodash';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { SUCCESS_CODE } from 'configs';
import BookingHotelPreview from './BookingHotelPreview';
import HotelBookForm from './HotelBookForm';
import useGetMe from 'hooks/useGetMe';

const BookingHotel = ({ closeModal, data }) => {

  const [record, setRecord] = useState({});
  const { user } = useGetMe();

  useEffect(() => {
    const { id, bookingList, note, infoHotel, status, createdAt, userId } = data;
    let lItem = { id, bookingList, ...infoHotel, note, status, userId, createdAt }
    if ((data?.id || '') === '') {
      lItem.bookingList = [{ userId: [user.id] }];
      setRecord(lItem);
      return;
    }
    for (let item of (lItem?.bookingList ?? [])) {
      if (data.userId !== user.id) {
        continue;
      }
      if (arrayNotEmpty(item.userId)) {
        let userIDs = item.userId;
        if (!userIDs.includes(user.id)) {
          item.userId.push(user.id);
        }
      } else {
        item.userId = [user.id];
      }
    }
    setRecord(lItem);
  }, [data, user]);

  const onSubmit = useCallback(async ({ createdAt, preview, ...data }) => {
    let values = cloneDeep(data);
    for (let item of (values?.bookingList ?? [])) {
      dateFormatOnSubmit(item, ['checkIn', 'checkOut'])
    }
    const { userId, bookingList, note, contentEmail, ...info } = values;
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? 'update' : 'create';
    let nUri = String("/tickes-hotel/").concat(uri);
    RequestUtils.Post(nUri, { ...params, bookingList, infoHotel: info, note, contentEmail }, params).then(
      ({ errorCode, message }) => {
        InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? message : "Lỗi gửi thông tin đặt nhà nghỉ, khách sạn .!");
      }
    );
  }, []);

  const formatOnSubmit = useCallback((values) => {
    let domContent = document.getElementById("np-content-html");
    if (domContent) {
      values.contentEmail = domContent.innerHTML;
    }
    return values;
  }, []);

  const goodShowPreview = useCallback((values) => {
    if ((record?.status || 0) > APP_FOLLOW_STATUS_WAITING) {
      return true;
    }
    return (values?.preview ?? false) === true;
  }, [record]);

  return <>
    <RestEditModal
      isMergeOnSubmit={false}
      formatOnSubmit={formatOnSubmit}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <Form.Item
        noStyle
        shouldUpdate={
          (prevValues, curValues) => prevValues.preview !== curValues.preview
            || prevValues.note !== curValues.note
            || prevValues.bookingList !== curValues.bookingList
            || prevValues.nameHotel !== curValues.nameHotel
        }
      >
        {({ getFieldValue }) => {
          const show = goodShowPreview(getFieldValue());
          return <BookingHotelPreview show={show} record={getFieldValue()} />
        }}
      </Form.Item>
      {(data?.status || 0) > APP_FOLLOW_STATUS_WAITING ? "" : <HotelBookForm />}
    </RestEditModal>
  </>
}

export default BookingHotel;