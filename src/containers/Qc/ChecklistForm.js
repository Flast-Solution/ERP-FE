import { Row, Col, Form } from 'antd';
import FormInput from '@erp/shared/dist/components/form/FormInput';
import FormSelect from '@erp/shared/dist/components/form/FormSelect';
import FormSelectUser from '@erp/shared/dist/components/form/FormSelectUser';
import FormTextArea from '@erp/shared/dist/components/form/FormTextArea';
import FormHidden from '@erp/shared/dist/components/form/FormHidden';
import BtnSubmit from '@erp/shared/dist/components/CustomButton/BtnSubmit';

const ChecklistForm = () => {
    return (
        <Form layout="vertical">
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'idQcCheckList'} />
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCheckListCode'}
                        label="Mã bộ tiêu chí"
                        placeholder="Vd: QC-CL-001"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCheckListName'}
                        label="Tên bộ tiêu chí"
                        placeholder="Vd: Checklist kiểm tra áo sơ mi"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelectUser
                        api="/product/fetch-type"
                        name={'productTypeId'}
                        label="Loại sản phẩm"
                        placeholder="Chọn loại sản phẩm"
                        valueProp="id"
                        titleProp="name"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        name={'version'}
                        label="Phiên bản"
                        placeholder="Vd: v1.0"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        name={'isActive'}
                        label="Trạng thái"
                        resourceData={[{ id: 0, name: 'Disable' }, { id: 1, name: 'Active' }]}
                        valueProp='id'
                        titleProp='name'
                        placeholder="Chọn trạng thái"
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormSelectUser
                        api="/qccriteria/list"
                        name={'criteriaIds'}
                        label="Danh sách tiêu chí"
                        placeholder="Chọn các tiêu chí"
                        mode="multiple"
                        valueProp="idQcCriteria"
                        titleProp="qcCriteriaName"
                        onData={(data) => Array.isArray(data?.embedded) ? data.embedded : []}
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormTextArea
                        name={'description'}
                        label="Mô tả"
                        placeholder="Nhập mô tả bộ tiêu chí"
                        rows={3}
                    />
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Hoàn thành' />
                </Col>
            </Row>
        </Form>
    );
};

export default ChecklistForm;
