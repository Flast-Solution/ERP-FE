import React, { useCallback } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';
import EditUserForm from './EditUserForm';
import { f5List } from 'utils/dataUtils';

const UserForm = ({ closeModal, data }) => {

  const onSubmit = useCallback( async (values) => {
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? '/user/update' : '/user/create';
    const { errorCode } = await RequestUtils.Post(uri, {...values, layout: 'UserLayout'}, params);
    f5List('user/fetch-user-department');
    InAppEvent.normalInfo(errorCode === 200 ? "Cập nhật thành công" : "Lỗi cập nhật, vui lòng thử lại sau");
  }, []);

  const formatDefaultValues = (values) => {
    return (values?.id ?? '' ) === '' ? {} : {
      ...values,
      branchId: values?.branchId,
      rules: values?.userProfiles?.map(i => i.type) ?? []
    };
  }

  return <>
    <RestEditModal
      isMergeOnSubmit={false}
      onSubmit={onSubmit}
      record={data}
      closeModal={closeModal}
      formatDefaultValues={formatDefaultValues}
    >
      <EditUserForm />
    </RestEditModal>
  </>
}

export default UserForm;