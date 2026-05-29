import React from 'react';
import { Col, Form } from 'antd';
import FormInput from '@/form-flast/FormInput';
import FormSelect from '@/form-flast/FormSelect';
import FormInputNumber from '@/form-flast/FormInputNumber';
import FormTextArea from '@/form-flast/FormTextArea';
import FormHidden from '@/form-flast/FormHidden';
import { FormListStyles } from '@/css/global';

const FormEvaluate = ({ form, field }) => {
    const evaluationType = Form.useWatch(
        ['inspectionCheckList', field.name, 'evaluationType'],
        form
    );

    return (
        <FormListStyles gutter={[16, 16]}>
            {/* ===== Hidden fields đúng API ===== */}
            <FormHidden name={[field.name, 'idQcCriteria']} />
            <FormHidden name={[field.name, 'idQcChecklist']} />
            <FormHidden name={[field.name, 'idQcInspectionBatch']} />

            {/* ===== Basic info ===== */}
            <Col md={12} xs={24}>
                <FormInput
                    name={[field.name, 'idQcCriteria']}
                    label="Mã tiêu chí"
                />
            </Col>

            <Col md={12} xs={24}>
                <FormInput
                    name={[field.name, 'idQcChecklist']}
                    label="Tên tiêu chí"
                />
            </Col>

            <Col md={12} xs={24}>
                <FormSelect
                    name={[field.name, 'evaluationType']}
                    label="Loại đánh giá"
                    required
                    resourceData={[
                        { id: 1, name: 'BOOLEAN' },
                        { id: 2, name: 'SCORE' },
                        { id: 3, name: 'QUANTITY' },
                        { id: 4, name: 'TEXT' }
                    ]}
                    valueProp="id"
                    titleProp="name"
                    onChange={() => {
                        const list = form.getFieldValue('inspectionCheckList') || [];
                        list[field.name] = {
                            ...list[field.name],
                            valueBoolean: undefined,
                            valueScore: undefined,
                            valueQuantity: undefined,
                            valueText: undefined,
                            unit: undefined
                        };
                        form.setFieldsValue({ inspectionCheckList: list });
                    }}
                />
            </Col>

            {/* ===== VALUE theo type ===== */}

            {/* BOOLEAN */}
            {evaluationType === 1 && (
                <Col md={24}>
                    <FormSelect
                        name={[field.name, 'valueBoolean']}
                        label="Kết quả"
                        required
                        resourceData={[
                            { id: 1, name: 'Đạt' },
                            { id: 0, name: 'Không đạt' }
                        ]}
                        valueProp="id"
                        titleProp="name"
                    />
                </Col>
            )}

            {/* SCORE */}
            {evaluationType === 2 && (
                <Col md={24}>
                    <FormInputNumber
                        name={[field.name, 'valueScore']}
                        label="Điểm"
                        required
                    />
                </Col>
            )}

            {/* QUANTITY */}
            {evaluationType === 3 && (
                <>
                    <Col md={12}>
                        <FormInputNumber
                            name={[field.name, 'valueQuantity']}
                            label="Số lượng"
                            required
                        />
                    </Col>
                    <Col md={12}>
                        <FormInput
                            name={[field.name, 'unit']}
                            label="Đơn vị"
                            required
                        />
                    </Col>
                </>
            )}

            {/* TEXT */}
            {evaluationType === 4 && (
                <Col md={24}>
                    <FormTextArea
                        name={[field.name, 'valueText']}
                        label="Mô tả"
                        required
                    />
                </Col>
            )}

            {/* ===== Score ===== */}
            <Col md={12}>
                <FormInputNumber
                    name={[field.name, 'scoreAchieved']}
                    label="Điểm đạt"
                />
            </Col>

            <Col md={12}>
                <FormInputNumber
                    name={[field.name, 'scoreMax']}
                    label="Điểm tối đa"
                />
            </Col>

            {/* ===== Time ===== */}
            <Col md={24}>
                <FormInput
                    name={[field.name, 'inspected_at']}
                    label="Thời gian kiểm tra"
                    placeholder="YYYY-MM-DD HH:mm:ss"
                />
            </Col>

            {/* ===== Note ===== */}
            <Col md={24}>
                <FormTextArea
                    name={[field.name, 'description']}
                    label="Ghi chú"
                />
            </Col>
        </FormListStyles>
    );
};

export default FormEvaluate;