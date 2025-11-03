/**************************************************************************/
/*  useGetMe.js                                                 		  */
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

import React, { useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import Form3Day from './Form3Day';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { f5List } from 'utils/dataUtils';

const Lead3DayForm = ({ data }) => {

  const [ record, setRecord ] = useState({});
  const onSubmit = async (dataCreate) => {
    const { 
      priority, 
      cause, 
      action, 
      newFeatures = "", 
      supportRequest = "", 
      active, 
      ...information 
    } = dataCreate;
    const { errorCode, message } = await RequestUtils.Post("/cs/3day-update", {
      priority,
      cause,
      action,
      active,
      objectId: data.id,
      information: { ...information, newFeatures, supportRequest },
    });
    if (errorCode === 200) {
      f5List('cs/3day-fetch');
    }
    InAppEvent.normalSuccess(message);
  }

  return <>
      <RestEditModal
        isMergeRecordOnSubmit={false}
        updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
        onSubmit={onSubmit}
        record={record}
      >
        <Form3Day />
      </RestEditModal>
  </>
}

export default Lead3DayForm;