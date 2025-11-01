/**************************************************************************/
/*  RestEditModal.js                                                      */
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

import { Form } from 'antd';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { useCallback, useEffect } from 'react';

const RestEditModal = ({
  children,
  record,
  isMergeRecordOnSubmit = true,
  formatOnSubmit = values => values,
  updateRecord = values => values,
  formatDefaultValues = values => values,
  onSubmit
}) => {

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(formatDefaultValues(record));
    /* eslint-disable-next-line */
  }, [form, record]);

  const onFinish = useCallback((values) => {
    const datas = isMergeRecordOnSubmit ? { ...record, ...values } : values;
    onSubmit(formatOnSubmit(datas));
    /* eslint-disable-next-line */
  }, [record, onSubmit]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <FormContextCustom.Provider value={{ form, record, updateRecord }}>
        {children}
      </FormContextCustom.Provider>
    </Form>
  );
};

export default RestEditModal;
