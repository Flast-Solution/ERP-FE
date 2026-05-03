import { Row, Col } from 'antd';
import FormInput from '@/form-flast/FormInput';
import FormSelect from '@/form-flast/FormSelect';

const ChecklistFilter = () => {
    return (
        <Row gutter={16}>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCheckListName'}
                    placeholder="Tên bộ tiêu chí"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCheckListCode'}
                    placeholder="Mã bộ tiêu chí"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormSelect
                    name={'isActive'}
                    placeholder='Trạng thái'
                    valueProp="id"
                    titleProp='name'
                    resourceData={[{ id: 0, name: 'Disable' }, { id: 1, name: 'Active' }]}
                />
            </Col>
        </Row>
    );
}

export default ChecklistFilter;
