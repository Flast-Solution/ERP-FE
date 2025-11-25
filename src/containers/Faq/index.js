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
import React, { useCallback, useState, useRef } from 'react';
import { Row, Col, message } from 'antd';
import RestEditModal from '@/components/RestLayout/RestEditModal';
import FormHidden from '@/components/form/FormHidden';
import FormInput from '@/components/form/FormInput';
import FormJoditEditor from '@/components/form/FormJoditEditor';
import CustomButton from '@/components/CustomButton';
import RequestUtils, { SUCCESS_CODE } from '@/utils/RequestUtils';
import { useEffectAsync } from '@/hooks/MyHooks';

const FormFaq = ({ closeModal, data }) => {

  const editorRef = useRef(null);
  const [ record, setRecord ] = useState({});

  useEffectAsync(async () => {
    setRecord(data?.faq ?? {});
  }, [ data ]);

  const onSubmit = useCallback(async (body) => {
    const { data, message: MEG, errorCode } = await RequestUtils.Post("/faq/save", body);
    message.info(MEG);
    if(SUCCESS_CODE === errorCode && typeof data?.onSave === 'function') {
      data.onSave(data);
    }
  }, []);

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col md={24} xs={24}>
          <FormHidden name={'id'} />
          <FormHidden name={'content'} />
        </Col>
        <Col md={24} xs={24}>
          <FormInput
            required
            label="Tên FaQ"
            name="name"
            placeholder={"Nhập tên Faq"}
          />
        </Col>
        <Col md={24} xs={24}>
          <h4>Nội dung: </h4>
          <FormJoditEditor 
            name="content"
            initContent={record?.content ?? ''}
            ref={editorRef}
          />
        </Col>
        <Col md={24} xs={24} style={{marginTop: 30}}>
          <CustomButton
            htmlType="submit"
            title="Hoàn thành"
            color="danger"
            variant="solid"
          />
        </Col>
      </Row>
    </RestEditModal>
  )
};

export default FormFaq;