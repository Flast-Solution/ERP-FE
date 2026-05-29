import { Row, Col } from 'antd';
import FormInput from '@/form-flast/FormInput';
import FormSelect from '@/form-flast/FormSelect';

const ChecklistFilter = ({ form, onFilter }) => {

    const handleReset = () => {
        form.resetFields();
    };

    const handleSubmit = () => {
        const values = form.getFieldsValue();
        onFilter?.(values);
    };

    return (
        <Row gutter={16}>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCheckListName'}
                    placeholder="Tên bộ quy trình"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormInput
                    name={'qcCheckListCode'}
                    placeholder="Mã bộ quy trình"
                />
            </Col>
            <Col xl={6} lg={6} md={6} xs={24}>
                <FormSelect
                    name={'isActive'}
                    placeholder='Trạng thái'
                    valueProp="id"
                    titleProp='name'
                    resourceData={[{ id: 0, name: 'Ngừng' }, { id: 1, name: 'Đang hoạt động' }]}
                />
            </Col>
            {/* BUTTON */}
            <Col xl={6} lg={6} md={6} xs={24}>
                <Space style={{ width: '100%' }}>
                    <Button type="primary" onClick={handleSubmit} style={{ flex: 1 }}>
                        Lọc
                    </Button>

                    <Button onClick={handleReset} style={{ flex: 1 }}>
                        Xoá lọc
                    </Button>
                </Space>
            </Col>
        </Row>
    );
}

export default ChecklistFilter;
