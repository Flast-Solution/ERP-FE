import React, { useCallback } from 'react'
import { Col, Row, Typography } from 'antd'
import { SwitcherOutlined } from '@ant-design/icons'
import FormListAddition from '@flast-erp/core/components/form/FormListAddtion';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import FormInput from '@flast-erp/core/components/form/FormInput';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RequestUtils, { SUCCESS_CODE } from '@flast-erp/core/utils/RequestUtils';
import { FormListStyles } from '@/css/global';
import DefectItem from './DefectItem';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
// import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';

const AddFormListError = ({ data, closeModal }) => {

    const onSubmit = useCallback(async (values) => {   
        const param = {
            orderDetailCode: values.orderDetailCode,
            idQcInspectionResult: values.idQcInspectionResult || null,
            defects: values.defects
        }
        try {
            const {errorCode} = await RequestUtils.Post('/qms/qc-defect/sync', param);
            InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? 'Cập nhât thành công !' : 'Cập nhât thất bại !');
        } catch (error) {
            InAppEvent.normalError('Cập nhât thất bại !');
        }
    }, [closeModal]);

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={data}
            closeModal={closeModal}
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'idQcInspectionResult'} />
                <Col md={24} xs={24}>
                    <FormInput
                        required
                        name={'orderDetailCode'}
                        label="Mã tiêu chí lỗi"
                        placeholder="Vd: QC-CL-001"
                    />
                </Col>
                <Col md={24} xs={24}>
                    <Typography.Title level={5}>
                        <SwitcherOutlined />
                            <span style={{ marginLeft: 20 }}>Lỗi phát sinh</span>
                    </Typography.Title>
                    <FormListAddition
                        name="defects"
                        textAddNew="Thêm mới phát sinh"
                        >
                        <DefectItem/>
                    </FormListAddition>
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Cập nhât' />
                </Col>
            </Row>
        </RestEditModal>
    )
}

export default AddFormListError