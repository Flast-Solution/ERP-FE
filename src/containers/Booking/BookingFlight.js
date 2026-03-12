import React, { useCallback, useEffect, useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { arrayNotEmpty, dateFormatOnSubmit } from 'utils/dataUtils';
import { Form } from 'antd';
import { APP_FOLLOW_STATUS_WAITING } from 'configs/constant';
import { cloneDeep } from 'lodash';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { SUCCESS_CODE } from 'configs';
import FlightBookForm from './FlightBookForm';
import BookingFlightPreview from './BookingFlightPreview';
import useGetMe from 'hooks/useGetMe';

const BookingFlight = ({ closeModal, data }) => {

  const [record, setRecord] = useState({});
  const { user } = useGetMe();

  useEffect(() => {
    (async () => {
      let values = await cloneDeep(data);
      if ((values?.id || '') === '') {
        values.scheduleBusList = [{ userId: [user.id] }];
        setRecord(values);
        return;
      }
      for (let item of (values?.scheduleBusList ?? [])) {
        if (values.id !== user.id) {
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
      setRecord(values);
    })();
  }, [data, user]);

  const onSubmit = useCallback(async ({ createdAt, preview, ...data }) => {
    let values = cloneDeep(data);
    for (let item of (values?.scheduleBusList ?? [])) {
      dateFormatOnSubmit(item, ['departureTime', 'arrivalTime'])
    }
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? 'update' : 'create';
    let nUri = String("/tickes-flight/").concat(uri);
    RequestUtils.Post(nUri, values, params).then(
      ({ errorCode, message }) => {
        InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? message : "Lỗi gửi thông tin đặt vé máy bay .!");
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
            || prevValues.scheduleBusList !== curValues.scheduleBusList
        }
      >
        {({ getFieldValue }) => {
          const show = goodShowPreview(getFieldValue());
          return <BookingFlightPreview show={show} record={getFieldValue()} />
        }}
      </Form.Item>
      {(data?.status || 0) > APP_FOLLOW_STATUS_WAITING ? "" : <FlightBookForm />}
    </RestEditModal>
  </>
}

export default BookingFlight;