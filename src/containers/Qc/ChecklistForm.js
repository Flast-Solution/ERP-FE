import React, { useCallback } from 'react';
import { Row, Col } from 'antd';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormSelectUser from '@flast-erp/core/components/form/FormSelectUser';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';

const ChecklistForm = ({ data, closeModal }) => {

    const onSubmit = useCallback(async (values) => {
        const isUpdate = !!values.idQcCheckList;
        const res = isUpdate 
            ? await QcService.updateChecklist(values) 
            : await QcService.addChecklist(values);
        
        const isSuccess = res?.errorCode === 200;
        if (isSuccess) {
            f5List('qms/qc-checklist/fetch');
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
                        api="cms/qc-criteria/list"
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
            </Row>
        </RestEditModal>
    );
};

export default ChecklistForm;

