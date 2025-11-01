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

import { useTranslation } from 'react-i18next';
import { Form, Input } from 'antd';
import FormInput from 'components/form/FormInput';
import useLogin from 'hooks/useLogin';
import CustomButton from 'components/CustomButton';

function Login() {

  const { login } = useLogin();
  const { t } = useTranslation();
  const [form] = Form.useForm();

  return (
    <div>
      <div className="auth-service-layout__title-wrapper">
        <div className="auth-service-layout__main-title">
          {t('login.title')}
        </div>
        <div className="auth-service-layout__min-title">
          {t('login.botTitle')}
        </div>
      </div>
      <Form layout="vertical" onFinish={login} form={form}>
        <FormInput
          name="username"
          label="input.email.label"
          placeholder="login.enterYourEmail"
          required
          messageRequire="input.email.validateMsg.required"
          rules={[
            {
              type: 'text',
              message: t('input.email.validateMsg.invalid'),
            },
          ]}
          size="large"
        />
        <FormInput
          name="password"
          label="input.password.label"
          placeholder="login.enterYourPassword"
          required
          messageRequire="input.password.validateMsg.required"
          ContentComponent={Input.Password}
          size="large"
        />
        <div className="btn-auth">
          <CustomButton htmlType="submit" title='Đăng nhập' />
        </div>
      </Form>
    </div>
  );
}

export default Login;
