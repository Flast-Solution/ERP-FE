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

import React, { useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';
import { arrayNotEmpty, f5List } from 'utils/dataUtils';
import { GATEWAY, HASH_MODAL_CLOSE } from 'configs';
import axios from "axios";
import LeadForm from './LeadForm';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const NewLead = ({ closeModal, data }) => {

  const { record: item, listServices, listSale } = data;
  const [record, setRecord] = useState(item);

  const onSubmit = async (values) => {
    const { fileUploads, ...body } = values;
    const randomNumbers = Array.from({ length: 10 }, () => getRandomInt(1, 9));
    const sessionId = randomNumbers.join("");

    if (arrayNotEmpty(fileUploads)) {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      for (let i = 0; i < fileUploads.length; i++) {
        formData.append('files[]', fileUploads[i]);
      }
      const endpoint = RequestUtils.generateUrlGetParams("/data/uploads-files", { sessionId });
      axios.post(String(GATEWAY).concat(endpoint), formData).then(d => d.data).then(console.log)
    }

    const { errorCode } = await RequestUtils.Post("/data/create", {
      sessionId,
      ...body
    });
    if (errorCode === 200) {
      f5List('data/lists');
      InAppEvent.normalSuccess("Cập nhật thành công");
      InAppEvent.emit(HASH_MODAL_CLOSE);
    }
  }

  return (
    <RestEditModal
      isMergeRecordOnSubmit={true}
      updateRecord={(values) => {
        setRecord(curvals => ({ ...curvals, ...values }))
      }}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <LeadForm
        listServices={listServices}
        listSale={listSale}
      />
    </RestEditModal>
  )
}

export default NewLead;