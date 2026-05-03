import { Row, Col } from 'antd';
import FormInput from '@/form-flast/FormInput';
import FormSelect from '@/form-flast/FormSelect';

const CriteriaFilter = () => {
    return (
        <Row gutter={16}>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCriteriaName'}
                    placeholder="Tên tiêu chí"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCriteriaCode'}
                    placeholder="Mã tiêu chí"
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

export default CriteriaFilter;
