/**************************************************************************/
/*  FormInputNumber.js                                                    */
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

import { Form, InputNumber, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatterInputNumber, parserInputNumber } from 'utils/tools';

const FormInputNumber = ({
  name,
  label,
  required,
  messageRequire = 'error.required',
  placeholder,
  rules = [],
  initialValue,
  formItemProps,
  isShowTooltip,
  form,
  ...props
}) => {
  const { t } = useTranslation();

  const formItem = (
    <Form.Item
      {...(label && {
        label: t(label),
      })}
      name={name}
      initialValue={initialValue}
      rules={[
        {
          required,
          message: t(messageRequire),
        },
        ...rules,
      ]}
      {...formItemProps}
    >
      <InputNumber
        {...(placeholder && {
          placeholder: t(placeholder),
        })}
        formatter={formatterInputNumber}
        parser={parserInputNumber}
        {...props}
      />
    </Form.Item>
  );

  return isShowTooltip ? (
    <Tooltip title={placeholder ? t(placeholder) : ''}>{formItem}</Tooltip>
  ) : (
    formItem
  );
};

export default FormInputNumber;
