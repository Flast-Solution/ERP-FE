import { Row, Col } from 'antd';
import FormInput from 'components/form/FormInput';
import FormHidden from 'components/form/FormHidden';
import BtnSubmit from 'components/common/BtnSubmit';
import FormSelectUser from 'components/form/FormSelectUser';
import FormSelect from 'components/form/FormSelect';

const EditUserForm = () => {
  return (
    <Row gutter={16} style={{marginTop: 20}}>
      <FormHidden name={'id'} />
      <Col md={12} xs={24}>
        <FormInput
          required
          name={'fullName'}
          label="Người dùng"
          placeholder="Họ tên"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={'phone'}
          label="SĐT"
          placeholder="Nhập SĐT"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={'email'}
          label="Email"
          placeholder="Nhập email"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={'ssoId'}
          label="Tài khoản"
          placeholder="Tên đăng nhập"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          name={'password'}
          label="Mật khẩu"
          placeholder="Mật khẩu đăng nhập"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectUser
          api='/user/fetch-department'
          name={'branchId'}
          label="Bộ phận"
          valueProp="id"
          titleProp='name'
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          name={'idUser'}
          label="Mã nhân viên"
          placeholder="Nhập mã nhân viên"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          required
          resourceData={[{id: 0, name: 'Disable'}, {id: 1, name: 'Actice'}]}
          valueProp='id'
          titleProp='name'
          name={'status'}
          label="Trạng thái"
          placeholder="Chọn trạng thái"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormSelectUser
          formatText={(text) => String(text).replace("ROLE_", "")}
          api='/user/fetch-role'
          name={'rules'}
          label="Phân Quyền"
          valueProp="type"
          titleProp='type'
          mode="multiple"
          allowClear
        />
      </Col>
      <BtnSubmit text='Hoàn thành' />
    </Row>
  )
}

export default EditUserForm;