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

import { message } from 'antd';
import RestEditModal from 'components/RestLayout/RestEditModal';
import React, { useEffect, useState } from 'react'
import WorkForm from './WorkForm';
import RequestUtils from 'utils/RequestUtils';
import { f5List } from 'utils/dataUtils';

const WorkContainer = ({ data }) => {

  const [ record, setRecord ] = useState({});
  useEffect(() => {
   setRecord(data)
  }, [data])

  const onSubmit = async (values) => {
    const { message: MSG } = await RequestUtils.Post("/works/save", values);
    message.info(MSG);
    f5List("works/fetch");
  }

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
    >
      <WorkForm />
    </RestEditModal>
  )
}

export default WorkContainer
