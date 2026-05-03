import React, { useCallback } from 'react'
import { Col, Row } from 'antd'
import moment from 'moment';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import FormInput from '@/form-flast/FormInput';
import FormInputNumber from '@/form-flast/FormInputNumber';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RequestUtils, { SUCCESS_CODE } from '@flast-erp/core/utils/RequestUtils';
import FormDatePicker from '@/form-flast/FormDatePicker';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { f5List } from '@flast-erp/core/utils/dataUtils';

const Shipment = ({ data, closeModal }) => {

    const onSubmit = useCallback(async (values) => {   
        const param = {
            orderDetailCode: values.orderDetailCode,
            productCode: values.productCode,
            qcInspectionBatchName: values.qcInspectionBatchName,
            numberProductBatch: values.numberProductBatch,
            inspectionDate: moment(values.inspectionDate).format('YYYY-MM-DD HH:mm:ss')
        }
        try {
            const {errorCode} = await RequestUtils.Post('/qms/qc-inspection-batch/save', param);
            if (errorCode) {
                f5List('erp/order/fetch');
                closeModal && closeModal();
            }
            InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? 'Cập nhật thành công !' : 'Cập nhật thất bại !');
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
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'orderDetailCode'}
                        label="Mã chi tiết đơn"
                        placeholder="Vd: QC-CL-001"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'productCode'}
                        label="Mã đơn"
                        placeholder="Vd: QC-CL-001"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcInspectionBatchName'}
                        label="Tên lô kiểm tra QC"
                        placeholder="Tên lô hàng"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInputNumber
                        required
                        name={'numberProductBatch'}
                        label="Số lô hàng"
                        placeholder="Số lượng"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormDatePicker
                        format='YYYY-MM-DD HH:mm'
                        showTime
                        required
                        label={"Thời gian"}
                        name={'inspectionDate'}
                        placeholder="Thời gian"
                    />
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Cập nhât' />
                </Col>
            </Row>
        </RestEditModal>
    )
}

export default Shipment