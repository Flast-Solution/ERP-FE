/**************************************************************************/
/*  FormInput.js                                                          */
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

import { useContext, useMemo } from 'react';
import { Form, Input, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormContextCustom } from '../context/FormContextCustom';

const FormInput = ({
  name,
  label,
  required,
  messageRequire = 'error.required',
  placeholder,
  rules = [],
  initialValue,
  formItemProps,
  ContentComponent = Input,
  whitespace,
  isShowTooltip,
  minLength,
  maxLength,
  ...props
}) => {
  const { t } = useTranslation();

  const { allowPressEnter, handleSubmit } = useContext(FormContextCustom);

  const minMaxRule = useMemo(() => {
    const ruleLengthArr = [];

    if (minLength) {
      ruleLengthArr.push({
        min: minLength,
        message: t('error.minLength', { min: minLength }),
      });
    }

    if (maxLength) {
      ruleLengthArr.push({
        max: maxLength,
        message: t('error.maxLength', { max: maxLength }),
      });
    }

    return ruleLengthArr;
  }, []); // eslint-disable-line

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
        ...(whitespace
          ? [
            {
              whitespace,
              message: t('error.empty'),
            },
          ]
          : []),
        ...minMaxRule,
        ...rules,
      ]}
      {...formItemProps}
    >
      <ContentComponent
        {...(placeholder && {
          placeholder: t(placeholder),
        })}
        {...props}
        onPressEnter={allowPressEnter ? handleSubmit : undefined}
      />
    </Form.Item>
  );

  return isShowTooltip ? (
    <Tooltip title={placeholder ? t(placeholder) : ''}>{formItem}</Tooltip>
  ) : (
    formItem
  );
};

export default FormInput;
