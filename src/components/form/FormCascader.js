/**************************************************************************/
/*  FormCascader.js                                                       */
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
import { Cascader, Form } from 'antd';
import { useTranslation } from 'react-i18next';
const { SHOW_CHILD } = Cascader;

const FormCascader = ({
  name,
  label,
  required,
  resourcesData = [],
  messageRequire = 'error.required',
  rules = [],
  initialValue,
  formItemProps,
  ...props
}) => {
  const { t } = useTranslation();
  const onChange = (value) => {
    console.log(value);
  };
  return (
    <Form.Item
      label={t(label)}
      name={name}
      rules={[
        { required, message: t(messageRequire) },
        ...rules,
      ]}
      initialValue={initialValue}
      {...formItemProps}
    >
      <Cascader
        style={{ width: '100%' }}
        options={resourcesData}
        onChange={onChange}
        multiple
        maxTagCount="responsive"
        showCheckedStrategy={SHOW_CHILD}
        {...props}
      />
    </Form.Item>
  );
};

export default FormCascader;