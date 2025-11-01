/**************************************************************************/
/*  FormRadioGroup.js                                                     */
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

import { Form, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import { map, get } from 'lodash';

const FormRadioGroup = ({
  name,
  label,
  required,
  messageRequire = 'error.required',
  placeholder,
  valueProp = 'id',
  titleProp = 'name',
  formatText = value => value,
  formatValue = value => value,
  rules = [],
  resourceData = [],
  initialValue,
  formItemProps,
  ...props
}) => {
  const { t } = useTranslation();
  return (
    <Form.Item
      {...(label && { label: t(label) })}
      name={name}
      initialValue={initialValue}
      rules={[
        { required, message: t(messageRequire) },
        ...rules,
      ]}
      {...formItemProps}
    >
      <Radio.Group
        {...(placeholder && { placeholder: t(placeholder) })}
        {...props}
      >
        {map(resourceData, (data, index) => (
          <Radio
            key={String(index)}
            value={formatValue(valueProp ? get(data, valueProp) : data, data)}
          >
            {formatText(titleProp ? get(data, titleProp) : data, data)}
          </Radio>
        ))}
      </Radio.Group>
    </Form.Item>
  );
};

export default FormRadioGroup;
