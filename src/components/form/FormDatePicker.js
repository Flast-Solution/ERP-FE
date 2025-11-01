/**************************************************************************/
/*  FormDatePicker.js                                                     */
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

import { DatePicker, Form } from 'antd';
import { FORMAT_DATE_INPUT } from 'configs/constant';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const FormDatePicker = ({
  name,
  label,
  required,
  messageRequire = 'error.required',
  initialValue,
  rules = [],
  placeholder,
  disabled = false,
  format = FORMAT_DATE_INPUT,
  formItemProps,
  ...props
}) => {
  const { t } = useTranslation();
  return (
    <Form.Item
      {...(label && {
        label: t(label),
      })}
      name={name}
      rules={[
        { required, message: t(messageRequire) },
        ...rules,
      ]}
      normalize={(value) => value && dayjs(value)}
      getValueProps={(value) => ({
        value: value && dayjs(value)
      })}
      {...formItemProps}
    >
      <DatePicker
        style={{ width: '100%' }}
        format={format}
        disabled={disabled}
        {...(placeholder && {
          placeholder: t(placeholder),
        })}
        {...props}
      />
    </Form.Item>
  );
};

export default FormDatePicker;
