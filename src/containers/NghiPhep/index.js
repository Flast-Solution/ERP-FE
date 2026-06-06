import React, { useCallback, useEffect, useState } from 'react';

import { RestEditModal } from '@flast-erp/core/components';
import NghiPhepForm from './NghiPhepForm';
import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { dateFormatOnSubmit, f5List } from '@flast-erp/core/utils';
import NPReview from './NPReview';
import NPConfirm from './NPConfirm';
import { Form } from 'antd';
import { NGHI_PHEP_STATUS_WAITING } from '@/configs/constant';
import useGetMe from '@/hooks/useGetMe';

const UserNPForm = ({ closeModal, data }) => {

  const { isLeader, isManager } = useGetMe();
  const [record, setRecord] = useState({});

  useEffect(() => {
    setRecord(data);
  }, [data]);

  const onSubmit = useCallback(async (values) => {
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? 'update' : 'create';
    let nUri = String("/leave-of-absence/").concat(uri);
    const { errorCode } = await RequestUtils.Post(nUri, { ...values, file: record?.file ?? '' }, params);
    f5List('leave-of-absence/fetch');
    InAppEvent.normalInfo(errorCode === 200 ? "Cập nhật thành công" : "Lỗi cập nhật, vui lòng thử lại sau");
    closeModal()
  }, [record, closeModal]);

  const formatOnSubmit = useCallback((values) => {
    dateFormatOnSubmit(values, ['createdAt', 'endAt', 'startedAt']);
    return values;
  }, []);

  const goodShowPreview = useCallback((values) => {
    if ((data?.status || 0) > NGHI_PHEP_STATUS_WAITING) {
      return true;
    }
    return (values?.preview ?? false) === true;
  }, [data]);

  const canApprove = isLeader() || isManager();
  if (canApprove && data?.id) {
    return <NPConfirm closeModal={closeModal} data={data} />;
  }

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
          (prevValues, curValues) =>
            prevValues.type !== curValues.type
            || prevValues.note !== curValues.note
            || prevValues.startedAt !== curValues.startedAt
            || prevValues.endAt !== curValues.endAt
            || prevValues.textOther !== curValues.textOther
            || prevValues.preview !== curValues.preview
        }
      >
        {({ getFieldValue }) => {
          const show = goodShowPreview(getFieldValue());
          return <NPReview show={show} record={getFieldValue()} />
        }}
      </Form.Item>
      {(data?.status || 0) > NGHI_PHEP_STATUS_WAITING ? "" : <NghiPhepForm />}
    </RestEditModal>
  </>
}

export default UserNPForm;