import { Row, Col } from 'antd';
import FormInput from '@/form-flast/FormInput';
import FormSelect from '@/form-flast/FormSelect';

const SEVERITY_OPTIONS = [
    { id: 'MINOR', name: 'MINOR' },
    { id: 'MAJOR', name: 'MAJOR' },
    { id: 'CRITICAL', name: 'CRITICAL' }
];

const DefectFilter = () => {
    return (
        <Row gutter={16}>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'defectName'}
                    placeholder="Tên lỗi"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'defectCode'}
                    placeholder="Mã lỗi"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'productCode'}
                    placeholder="Mã sản phẩm"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormSelect
                    name={'severity'}
                    placeholder='Mức độ lỗi'
                    valueProp="id"
                    titleProp='name'
                    resourceData={SEVERITY_OPTIONS}
                />
            </Col>
        </Row>
    );
}

export default DefectFilter;
