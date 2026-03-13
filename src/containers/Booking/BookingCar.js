import React, { useCallback, useEffect, useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { arrayNotEmpty, dateFormatOnSubmit } from 'utils/dataUtils';
import { Form } from 'antd';
import { APP_FOLLOW_STATUS_WAITING } from 'configs/constant';
import BookingCarPreview from './BookingCarPreview';
import CarBookForm from './CarBookForm';
import { cloneDeep } from 'lodash';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { SUCCESS_CODE } from 'configs';
import CarService from 'services/CarService';

const BookingCar = ({ closeModal, data }) => {

  const [record, setRecord] = useState({});
  useEffect(() => {
    let values = cloneDeep(data);
    if (arrayNotEmpty(values.scheduleBusList)) {
      for (let item of values.scheduleBusList) {
        item.employeType = arrayNotEmpty(item.userId) ? true : false;
      }
    }
    setRecord(values);
  }, [data]);

  const onSubmit = useCallback(async ({ createdAt, preview, ...data }) => {
    let values = cloneDeep(data);
    const allPickup = CarService.getAllDiemDon();
    const allDestination = CarService.getAllDiemTra();
    values.amountOfGuest = 1;
    if (arrayNotEmpty(values.scheduleBusList)) {
      for (let item of values.scheduleBusList) {
        if (values.amountOfGuest === 1) {
          values.amountOfGuest = item.amountOfGuest;
        }
        dateFormatOnSubmit(item, ['pickupTime']);
        if (arrayNotEmpty(item.listPickup)) {
          for (let itemPickup of item.listPickup) {
            dateFormatOnSubmit(itemPickup, ['pickupTime']);
            itemPickup.address = allPickup.find(i => i.name === itemPickup.name)?.address ?? '';
          }
        }
        if (arrayNotEmpty(item.listDestinations)) {
          for (let itemDest of item.listDestinations) {
            dateFormatOnSubmit(itemDest, ['pickupTime']);
            itemDest.address = allDestination.find(i => i.name === itemDest.name)?.address ?? '';
          }
        }
      }
    }
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? 'update' : 'create';
    let nUri = String("/tickes-bus/").concat(uri);
    RequestUtils.Post(nUri, values, params).then(({ errorCode, message }) => {
      InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? message : "Lỗi gửi thông tin đặt xe .!");
    });
  }, []);

  const formatOnSubmit = useCallback((values) => {
    // let domContent = document.getElementById("np-content-html");
    // if (domContent) {
    //   values.contentEmail = domContent.innerHTML;
    // }
    return values;
  }, []);

  const goodShowPreview = useCallback((values) => {
    if ((data?.status || 0) > APP_FOLLOW_STATUS_WAITING) {
      return true;
    }
    return (values?.preview ?? false) === true;
  }, [data]);

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
        }
      >
        {({ getFieldValue }) => {
          const show = goodShowPreview(getFieldValue());
          return <BookingCarPreview show={show} record={getFieldValue()} />
        }}
      </Form.Item>
      {(data?.status || 0) > APP_FOLLOW_STATUS_WAITING ? "" : <CarBookForm />}
    </RestEditModal>
  </>
}

export default BookingCar;