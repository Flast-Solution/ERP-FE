import React, { useCallback } from 'react';
import { Row, Col } from 'antd';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormInputNumber from '@flast-erp/core/components/form/FormInputNumber';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';

const CriteriaForm = ({ data, closeModal }) => {

    const onSubmit = useCallback(async (values) => {
        const isUpdate = !!values.idQcCriteria;
        const res = isUpdate 
            ? await QcService.updateCriteria(values) 
            : await QcService.addCriteria(values);
        
        const isSuccess = res?.errorCode === 200;
        if (isSuccess) {
            f5List('qms/qc-criteria/fetch');
            closeModal && closeModal();
        }
        InAppEvent.normalInfo(isSuccess ? "Cập nhật thành công" : (res?.message || "Lỗi cập nhật, vui lòng thử lại sau"));
    }, [closeModal]);

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={data}
            closeModal={closeModal}
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'idQcCriteria'} />
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCriteriaCode'}
                        label="Mã tiêu chí"
                        placeholder="Nhập mã tiêu chí"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCriteriaName'}
                        label="Tên tiêu chí"
                        placeholder="Nhập tên tiêu chí"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        required
                        name={'evaluationType'}
                        label="Loại đánh giá"
                        placeholder="Chọn loại đánh giá"
                        resourceData={[
                            { id: 1, name: 'BOOLEAN (Đạt/Không)' },
                            { id: 2, name: 'SCORE (Thang điểm)' },
                            { id: 3, name: 'QUANTITY (Định lượng)' },
                            { id: 4, name: 'TEXT (Mô tả)' }
                        ]}
                        valueProp="id"
                        titleProp="name"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        name={'version'}
                        label="Phiên bản"
                        placeholder="Nhập phiên bản (vd: 1.0)"
                    />
                </Col>
                <Col md={8} xs={24}>
                    <FormInputNumber
                        name={'targetMin'}
                        label="Giá trị tối thiểu"
                        placeholder="Min"
                    />
                </Col>
                <Col md={8} xs={24}>
                    <FormInputNumber
                        name={'targetMax'}
                        label="Giá trị tối đa"
                        placeholder="Max"
                    />
                </Col>
                <Col md={8} xs={24}>
                    <FormInput
                        name={'targetValue'}
                        label="Giá trị mục tiêu"
                        placeholder="Target"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        name={'units'}
                        label="Đơn vị đo"
                        placeholder="Vd: POINT, %, PCS..."
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
                <Col md={8} xs={24}>
                    <FormInputNumber
                        name={'scaleMin'}
                        label="Điểm tối thiểu"
                        placeholder="Scale Min"
                    />
                </Col>
                <Col md={8} xs={24}>
                    <FormInputNumber
                        name={'scaleMax'}
                        label="Điểm tối đa"
                        placeholder="Scale Max"
                    />
                </Col>
                <Col md={8} xs={24}>
                    <FormInputNumber
                        name={'weight'}
                        label="Trọng số (%)"
                        placeholder="Weight"
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormTextArea
                        name={'description'}
                        label="Ghi chú"
                        placeholder="Mô tả chi tiết"
                        rows={3}
                    />
                </Col>
            </Row>
        </RestEditModal>
    );
};

export default CriteriaForm;

