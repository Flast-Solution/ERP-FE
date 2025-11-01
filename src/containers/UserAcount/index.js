/**************************************************************************/
/*  index.js                                                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import RestEditModal from 'components/RestLayout/RestEditModal';
import React, { useEffect, useState } from 'react'
import UserForm from './UserForm';
import RequestUtils from 'utils/RequestUtils';
import { validateRegex } from 'utils/validateUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { f5List } from 'utils/dataUtils';

const UserAccount = ({ data }) => {

  const [ record, setRecord ] = useState({});
  const [ listProFile, setListProFile ] = useState([]);

  useEffect(() => {
    RequestUtils.GetAsList('/user/list-role').then(setListProFile);
  }, [])

  const onSubmit = async (dataCreate) => {
    if (!/^\+?[0-9]{9,15}$/.test(dataCreate.phone || data?.phone)) {
      InAppEvent.normalInfo('Vui lòng nhập đúng số điện thoại định dạng');
      return;
    }

    if (!validateRegex.email.test(dataCreate.email || data?.email)) {
      InAppEvent.normalInfo('Vui lòng nhập đúng Email định dạng');
      return;
    }
    const newDataUserInfo = dataCreate?.userProfiles?.map(item => ({id: item || 0}));
    const dataUpdate = {
      ...dataCreate,
      userProfiles: newDataUserInfo
    }
    if (Object.keys(data)?.length > 0) {
      const { message } = await RequestUtils.Post('/user/update', dataUpdate, {id: data.id});
      InAppEvent.normalSuccess(message);
    } else {
      const { message } = await RequestUtils.Post('/user/create', dataUpdate);
      InAppEvent.normalSuccess(message);
    }
    f5List("user/list");
  }

  return (
    <RestEditModal
      isMergeRecordOnSubmit={true}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
    >
      <UserForm listProFile={listProFile} />
    </RestEditModal>
  )
}

export default UserAccount
