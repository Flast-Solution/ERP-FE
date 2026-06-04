import React, { useCallback } from 'react'
import { Col, Form, Row, Typography } from 'antd'
import { SwitcherOutlined } from '@ant-design/icons'

import {
  FormListAddtion,
  FormInput,
  RestEditModal,
  BtnSubmit
} from "@flast-erp/core/components";

import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import FormEvaluate from './FormEvaluate';
import { SUCCESS_CODE } from '@/configs';

const OrderEvaluate = ({ data, closeModal }) => {
    const [form] = Form.useForm(); 

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
    }, []);

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={data}
            closeModal={closeModal}
            form={form} 
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                {/* <FormHidden name={""} /> */}
                <Col md={24} xs={24}>
                    <FormInput
                        required
                        name={'idQcInspectionBatch'}
                        label="id Lô"
                        placeholder="id Lô"
                    />
                </Col>
                <Col md={24} xs={24}>
                    <Typography.Title level={5}>
                        <SwitcherOutlined />
                        <span style={{ marginLeft: 20 }}>Danh sách</span>
                    </Typography.Title>
                    <FormListAddtion
                        name="inspectionCheckList"
                        textAddNew="Thêm mới phát sinh"
                    >
                        <FormEvaluate form={form}/>
                    </FormListAddtion>
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Cập nhât' />
                </Col>
            </Row>
        </RestEditModal>
    )
}

export default OrderEvaluate