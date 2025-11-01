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

import React, { useContext } from 'react';
import { Typography, Button, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import { CloseCircleFilled, PlusOutlined } from '@ant-design/icons';
import { FormContextCustom } from 'components/context/FormContextCustom';
import FormStyles from './styles';

const FormListAddition = ({
  children,
  name,
  showBtnInLeft = true,
  textAddNew = 'Thêm mới',
  title,
  formatInitialValue = value => value,
  defaultValueItem,
}) => {

  const { t } = useTranslation();
  const { record } = useContext(FormContextCustom);

  const value = get(record, name);
  const initialValue = isEmpty(value) ? [{}] : formatInitialValue(value);

  return (
    <FormStyles className="form-list__list-wrapper">
      {title && <Typography.Title level={4}>{t(title)}</Typography.Title>}
      <div className="form-list__list">
        <Form.List name={name} initialValue={initialValue}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map(field => (
                <div key={field.key} className="form-list__list-item">
                  {React.cloneElement(children, { field })}
                  <CloseCircleFilled
                    className="form-list__remove-button"
                    onClick={() => remove(field.name)}
                  />
                </div>
              ))}
              <Form.Item>
                <div style={{ display: 'flex', justifyContent: showBtnInLeft ? 'flex-start' : 'flex-end' }}>
                  <Button
                    type="dashed"
                    onClick={() => add(defaultValueItem)}
                    icon={<PlusOutlined />}
                  >
                    {textAddNew}
                  </Button>
                </div>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </>
          )}
        </Form.List>
      </div>
    </FormStyles>
  );
};

export default FormListAddition;
