import { Col, Row } from 'antd';
import CustomButton from 'components/CustomButton';
import FormDatePicker from 'components/form/FormDatePicker';
import FormHidden from 'components/form/FormHidden';
import FormInput from 'components/form/FormInput';
import FormInputNumber from 'components/form/FormInputNumber';
import FormSelect from 'components/form/FormSelect';
import FormTextArea from 'components/form/FormTextArea';
import FormSelectInfiniteBusinessUser from 'components/form/SelectInfinite/FormSelectInfiniteBusinessUser';
import { DEPARTMENT, PROJECT_STATUS_LIST } from 'configs/localData';

const WorkForm = () => {
  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <Col md={24} xs={26}>
        <FormHidden name="id" />
      </Col>
      <Col md={12} xs={26}>
        <FormInput 
          required
          name="name"
          placeholder="Nhập tên dự án"
          label="Tên dự án"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect 
          required
          resourceData={[{name: 'Low'}, {name: "Medium"}, {name: "High"}]}
          name="priority"
          titleProp='name'
          valueProp='name'
          placeholder="Độ ưu tiên"
          label="Ưu tiên"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormTextArea 
          required
          name="description"
          placeholder="Nhập mô tả dự án"
          label="Mô tả dự án"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect 
          required
          label="Bộ phận"
          name="departmentId"
          valueProp='value'
          placeholder='Chọn bộ phận'
          resourceData={DEPARTMENT}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectInfiniteBusinessUser 
          required
          name="managerId"
          placeholder="Chủ dự án"
          label="Chủ dự án"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormSelectInfiniteBusinessUser 
          required
          mode="multiple"
          name="listMember"
          valueProp="ssoId"
          placeholder="Chọn thành viên"
          label="Thành viên"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker 
          name="startDate"
          placeholder="Ngày bắt đầu"
          label="Ngày bắt đầu"
          required
        />
      </Col>
      <Col md={12} xs={24}>
        <FormDatePicker 
          name="endDate"
          placeholder="Ngày kết thúc"
          label="Ngày kết thúc"
          required
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInputNumber 
          name="budget"
          placeholder="Ngân sách nếu có"
          label="Ngân sách"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect 
          required
          resourceData={PROJECT_STATUS_LIST.map(item => ({name: item}))}
          name="status"
          titleProp='name'
          valueProp='name'
          placeholder="Chọn trạng thái"
          label="Trạng thái"
        />
      </Col>
      <Col md={24} xs={24}>
        <CustomButton 
          title='Hoàn thành'
          htmlType="submit"
        />
      </Col>
    </Row>
  )
}

export default WorkForm;
