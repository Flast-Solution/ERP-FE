/**************************************************************************/
/*  index.js                                                          		*/
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

import React from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import Form7Day from 'containers/Lead3DayForm/Form3Day';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import { f5List } from 'utils/dataUtils';

const CoHoi7DayForm = ({ data }) => {

  const onSubmit = async (values) => {
    const { priority, cause, action, newFeatures = "", supportRequest = "", ...lead3Day } = values;
    const { message } = await RequestUtils.Post("/cs/order-update", {
      priority,
      cause,
      action,
      objectId: data.id,
      objectType: data.type,
      lead3Day: { ...lead3Day, newFeatures, supportRequest },
    });
    f5List('cs/co-hoi-order-fetch');
    InAppEvent.normalSuccess(message);
  }

  return <>
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => values}
      onSubmit={onSubmit}
      record={data}
    >
      <Form7Day />
    </RestEditModal>
  </>
}

export default CoHoi7DayForm;