import React, { useCallback } from 'react';
import { Row, Col, Form } from 'antd';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormInputNumber from '@flast-erp/core/components/form/FormInputNumber';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';

const CriteriaForm = ({ data, closeModal }) => {

  const [ form ] = Form.useForm();
  const evaluationType = Form.useWatch('evaluationType', form);

  const isUpdate = data && data.idQcCriteria;
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
    InAppEvent.normalInfo(res?.message || "Lỗi chưa xác định");
  }, [ closeModal ]);

  const isBooleanType = evaluationType === 1;
  const isScoreType = evaluationType === 2;
  const isQuantityType = evaluationType === 3;
  const isTextType = evaluationType === 4;

  return (
    <RestEditModal
      isMergeRecordOnSubmit={true}
      onSubmit={onSubmit}
      record={data}
      closeModal={closeModal}
      form={form}
    >
      <Row gutter={16} style={{ marginTop: 20 }}>
        <FormHidden name={'idQcCriteria'} />
        <Col md={12} xs={24}>
          <FormInput
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
            onChange={() => {
              form.setFieldsValue({
                targetMin: undefined,
                targetMax: undefined,
                targetValue: undefined,
                scaleMin: undefined,
                scaleMax: undefined,
                units: undefined
              });
            }}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            name={'version'}
            label="Phiên bản"
            placeholder="Nhập phiên bản (vd: 1.0)"
          />
        </Col>

        {/* BOOLEAN: Chỉ hiển thị targetValue */}
        {isBooleanType && (
          <Col md={24} xs={24}>
            <FormInput
              name={'targetValue'}
              label="Giá trị mục tiêu"
              placeholder="Vd: Đạt, Không đạt, Pass, Fail..."
              required
            />
          </Col>
        )}

        {/* SCORE: Hiển thị scale_min, scale_max, target_min */}
        {isScoreType && (
          <>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                name={'scaleMin'}
                label="Điểm tối thiểu"
                placeholder="Scale Min (vd: 0)"
              />
            </Col>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                name={'scaleMax'}
                label="Điểm tối đa"
                placeholder="Scale Max (vd: 100)"
              />
            </Col>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                name={'targetMin'}
                label="Giá trị tối thiểu đạt yêu cầu"
                placeholder="Điểm tối thiểu cần đạt (vd: 70)"
              />
            </Col>
          </>
        )}

        {/* QUANTITY: Hiển thị target_min, target_max, units */}
        {isQuantityType && (
          <>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                name={'targetMin'}
                label="Giá trị tối thiểu"
                placeholder="Min (vd: 0)"
              />
            </Col>
            <Col md={8} xs={24}>
              <FormInputNumber
                required
                name={'targetMax'}
                label="Giá trị tối đa"
                placeholder="Max (vd: 1000)"
              />
            </Col>
            <Col md={8} xs={24}>
              <FormInput
                required
                name={'units'}
                label="Đơn vị đo"
                placeholder="Vd: PCS, KG, M, L..."
              />
            </Col>
          </>
        )}

        {/* TEXT: Hiển thị target_value (hướng dẫn nhập) */}
        {isTextType && (
          <Col md={24} xs={24}>
            <FormInput
              name={'targetValue'}
              label="Hướng dẫn nhập"
              placeholder="Vd: Nhập mô tả chi tiết, tối thiểu 50 ký tự..."
              required
            />
          </Col>
        )}

        {/* Các trường chung cho tất cả các loại */}
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

        {/* Trường mô tả chung */}
        <Col md={24} xs={24}>
          <FormTextArea
            name={'description'}
            label="Ghi chú"
            placeholder="Mô tả chi tiết về tiêu chí đánh giá"
            rows={3}
          />
        </Col>

        {/* Trọng số - có thể áp dụng cho tất cả các loại */}
        <Col md={24} xs={24}>
          <FormInputNumber
            name={'weight'}
            label="Trọng số (%)"
            placeholder="Weight (0-100)"
            min={0}
            max={100}
          />
        </Col>

        <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
          <BtnSubmit text={isUpdate ? 'Cập nhật' : 'Thêm mới'} />
        </Col>
      </Row>
    </RestEditModal>
  )
};

export default CriteriaForm;