import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import axios from 'axios';
import { CloseOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import {
  FormDatePicker,
  FormInput,
  FormInputNumber,
  FormSelect,
  FormTextArea,
} from '@flast-erp/core/components';
import dayjs from 'dayjs';
import useUserOptions from '../hooks/useUserOptions';
import { CancelButton, DeleteButton, DrawerCloseButton, DrawerEyebrow, DrawerFooter, DrawerForm, DrawerHeading, DrawerOwner, DrawerTitle, FooterActions, FormGrid, FullSegmented, GuardText, KpiDrawer, PeriodHint, SaveButton } from './IndicatorDrawer.styles';

const KPI_TYPE_OPTIONS = [
  { value: 'ORDER', label: 'Đơn hàng' },
  { value: 'COHOI', label: 'Cơ hội' },
  { value: 'MANUFACTURE', label: 'Sản xuất' },
  { value: 'DATA', label: 'Lead' },
];

const IndicatorDrawer = ({ drawer, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const frequency = Form.useWatch('frequency', form) || 'quarter';
  const idUser = Form.useWatch('idUser', form);
  const isEdit = drawer.mode === 'edit';
  const indicator = drawer.indicator;
  const employee = drawer.employee;
  const { userLoadError, userLoading, userOptions } = useUserOptions(drawer.open);
  const idUserName = userOptions.find(
    (option) => String(option.value) === String(idUser),
  )?.label || employee?.fullName || 'Chưa chọn';

  useEffect(() => {
    if (!drawer.open) return;

    const today = dayjs();
    const currentQuarter = String(Math.floor(today.month() / 3) + 1);

    form.setFieldsValue({
      code: isEdit ? (indicator?.code || '') : '',
      type: isEdit ? (indicator?.type || undefined) : undefined,
      name: isEdit ? indicator?.name : '',
      description: isEdit ? indicator?.description : '',
      unit: isEdit ? indicator?.unit : undefined,
      weight: isEdit ? indicator?.weight : undefined,
      target: isEdit ? indicator?.target : undefined,
      targetDirection: isEdit ? indicator?.targetDirection : undefined,
      frequency: isEdit ? (indicator?.frequency || 'quarter') : 'quarter',
      startDate: indicator?.startDate ? dayjs(indicator.startDate) : today.startOf('week'),
      endDate: indicator?.endDate ? dayjs(indicator.endDate) : today.endOf('week'),
      month: String(indicator?.month || today.month() + 1),
      quarter: String(indicator?.quarter || currentQuarter),
      year: indicator?.year ? dayjs(String(indicator.year)) : today.startOf('year'),
      idUser: isEdit ? indicator?.idUser : employee?.id,
    });
  }, [drawer.open, employee?.id, form, indicator, isEdit]);

  useEffect(() => {
    if (!drawer.open || !userOptions.length) return;

    const idUser = form.getFieldValue('idUser');
    const hasCurrentidUser = userOptions.some(
      (option) => String(option.value) === String(idUser),
    );

    if (!hasCurrentidUser) {
      form.setFieldValue('idUser', userOptions[0].value);
    }
  }, [drawer.open, form, userOptions]);

  const handleSave = async () => {
    let values;

    try {
      values = await form.validateFields();
    } catch (validationError) {
      const firstErrorField = validationError?.errorFields?.[0]?.name;

      if (firstErrorField) {
        form.scrollToField(firstErrorField, { block: 'center' });
        form.getFieldInstance(firstErrorField)?.focus?.();
      }
      return;
    }

    const payload = {
      ...(isEdit && indicator?.id ? { id: indicator.id } : {}),
      ...values,
      startDate: values.startDate?.format?.('YYYY-MM-DD') ?? values.startDate ?? null,
      endDate: values.endDate?.format?.('YYYY-MM-DD') ?? values.endDate ?? null,
      year: values.year?.format?.('YYYY') ?? values.year ?? null,
    };

    console.log(`[KPI][${isEdit ? 'UPDATE' : 'CREATE'}] submit payload:`, payload);
    setSaving(true);

    try {
      const { data: response } = await axios.post('/user/kpi/save', payload, {
        timeout: 30000,
      });
      const isSuccess = response?.success === true || Number(response?.errorCode) === 200;

      if (!isSuccess) {
        message.error(response?.message || 'Lưu chỉ tiêu KPI thất bại.');
        return;
      }

      message.success(response?.message || 'Đã lưu chỉ tiêu KPI.');
      onSaved?.(response?.data);
      onClose();
    } catch (requestError) {
      console.error('[KPI] Không thể lưu chỉ tiêu KPI:', requestError);
      message.error(
        requestError?.response?.data?.message
        || (requestError?.code === 'ECONNABORTED'
          ? 'Yêu cầu lưu KPI đã quá thời gian chờ.'
          : 'Không thể lưu chỉ tiêu KPI. Vui lòng thử lại.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFrequencyChange = (value) => {
    const periodDefaults = {
      week: {
        startDate: dayjs().startOf('week'),
        endDate: dayjs().endOf('week'),
      },
      month: {
        month: String(dayjs().month() + 1),
        year: dayjs().startOf('year'),
      },
      quarter: {
        quarter: String(Math.floor(dayjs().month() / 3) + 1),
        year: dayjs().startOf('year'),
      },
      year: { year: dayjs().startOf('year') },
    };

    form.setFieldsValue({ frequency: value, ...periodDefaults[value] });
  };

  const renderEvaluationPeriod = () => {
    if (frequency === 'week') {
      return (
        <FormGrid>
          <FormDatePicker
            label="Từ ngày"
            name="startDate"
            required
            messageRequire="Chọn ngày bắt đầu"
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
          />
          <FormDatePicker
            label="Đến ngày"
            name="endDate"
            required
            messageRequire="Chọn ngày kết thúc"
            format="DD/MM/YYYY"
            placeholder="Chọn ngày"
            formItemProps={{ dependencies: ['startDate'] }}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue('startDate');
                  if (!value || !startDate || !value.isBefore(startDate, 'day')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
                },
              }),
            ]}
          />
        </FormGrid>
      );
    }

    if (frequency === 'month') {
      return (
        <FormGrid>
          <FormSelect
            label="Tháng"
            name="month"
            required
            messageRequire="Chọn tháng"
            placeholder="Chọn tháng"
            resourceData={Array.from({ length: 12 }, (_, index) => ({
              value: String(index + 1),
              label: `Tháng ${index + 1}`,
            }))}
            valueProp="value"
            titleProp="label"
          />
          <YearField />
        </FormGrid>
      );
    }

    if (frequency === 'year') {
      return <YearField />;
    }

    return (
      <FormGrid>
        <FormSelect
          label="Quý"
          name="quarter"
          required
          messageRequire="Chọn quý"
          placeholder="Chọn quý"
          resourceData={[
            { value: '1', label: 'Quý 1' },
            { value: '2', label: 'Quý 2' },
            { value: '3', label: 'Quý 3' },
            { value: '4', label: 'Quý 4' },
          ]}
          valueProp="value"
          titleProp="label"
        />
        <YearField />
      </FormGrid>
    );
  };

  const YearField = () => (
    <FormDatePicker
      label="Năm"
      name="year"
      required
      messageRequire="Chọn năm"
      picker="year"
      format="YYYY"
      placeholder="Chọn năm"
    />
  );

  return (
    <KpiDrawer
      open={drawer.open}
      width="min(620px, 100vw)"
      onClose={onClose}
      closable={false}
      destroyOnClose
      extra={<DrawerCloseButton type="text" icon={<CloseOutlined />} onClick={onClose} />}
      title={(
        <DrawerHeading>
          <DrawerEyebrow>{isEdit ? 'Sửa chỉ tiêu' : 'Chỉ tiêu mới'}</DrawerEyebrow>
          <DrawerTitle>{isEdit ? indicator?.name : 'Thêm chỉ tiêu KPI'}</DrawerTitle>
          <DrawerOwner>Người phụ trách: {idUserName}</DrawerOwner>
        </DrawerHeading>
      )}
      footer={(
        <DrawerFooter $edit={isEdit}>
          {isEdit && (
            <DeleteButton danger icon={<DeleteOutlined />} onClick={onClose}>
              Xóa chỉ tiêu
            </DeleteButton>
          )}
          <FooterActions>
            <CancelButton type="text" onClick={onClose}>Hủy</CancelButton>
            <SaveButton
              htmlType="button"
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={saving}
              onClick={handleSave}
            >
              Lưu chỉ tiêu
            </SaveButton>
          </FooterActions>
        </DrawerFooter>
      )}
    >
      <DrawerForm form={form} layout="vertical" requiredMark>
        <FormGrid>
          <FormInput
            label="Mã chỉ tiêu"
            name="code"
            required
            messageRequire="Nhập mã chỉ tiêu"
            maxLength={100}
            placeholder="VD: KPI-QC-01"
          />
          <FormInput
            label="Tên chỉ tiêu"
            name="name"
            required
            messageRequire="Nhập tên chỉ tiêu"
            placeholder="Nhập tên chỉ tiêu"
          />
        </FormGrid>

        <FormSelect
          label="Loại KPI"
          name="type"
          required
          messageRequire="Chọn loại KPI"
          placeholder="Chọn loại KPI"
          resourceData={KPI_TYPE_OPTIONS}
          valueProp="value"
          titleProp="label"
        />

        <FormTextArea
          label="Mô tả"
          name="description"
          rows={4}
          placeholder="Giải thích ngắn gọn cách đo và ý nghĩa chỉ tiêu"
        />

        <FormGrid>
          <FormSelect
            label="Đơn vị đo"
            name="unit"
            required
            messageRequire="Chọn đơn vị đo"
            placeholder="Chọn đơn vị đo"
            resourceData={[
              { value: 'mẫu / quý', label: 'mẫu / quý' },
              { value: 'giờ / mẫu', label: 'giờ / mẫu' },
              { value: '%', label: '%' },
              { value: 'điểm audit', label: 'điểm audit' },
            ]}
            valueProp="value"
            titleProp="label"
          />
          <FormInputNumber
            label="Trọng số (%)"
            name="weight"
            required
            messageRequire="Nhập trọng số"
            min={1}
            max={100}
          />
        </FormGrid>

        <FormGrid>
          <FormInputNumber
            label="Mục tiêu"
            name="target"
            required
            messageRequire="Nhập mục tiêu"
            min={0}
          />
          <FormSelect
            label="Hướng mục tiêu"
            name="targetDirection"
            required
            messageRequire="Chọn hướng mục tiêu"
            placeholder="Chọn hướng mục tiêu"
            resourceData={[
              { value: 'min', label: 'Đạt tối thiểu (càng cao càng tốt)' },
              { value: 'max', label: 'Không vượt quá (càng thấp càng tốt)' },
            ]}
            valueProp="value"
            titleProp="label"
          />
        </FormGrid>

        <Form.Item
          label="Kỳ đánh giá"
          name="frequency"
          rules={[{ required: true }]}
        >
          <FullSegmented options={[
            { label: 'Tuần', value: 'week' },
            { label: 'Tháng', value: 'month' },
            { label: 'Quý', value: 'quarter' },
            { label: 'Năm', value: 'year' },
          ]} onChange={handleFrequencyChange} />
        </Form.Item>

        {renderEvaluationPeriod()}

        <FormSelect
          label="Người phụ trách"
          name="idUser"
          required
          messageRequire="Chọn người phụ trách"
          resourceData={userOptions}
          valueProp="value"
          titleProp="label"
          showSearch
          loading={userLoading}
          placeholder={userLoading ? 'Đang tải danh sách người dùng...' : 'Chọn người phụ trách'}
          notFoundContent={userLoadError ? 'Không tải được danh sách người dùng' : 'Không có người dùng'}
        />

        {frequency === 'week' ? (
          <PeriodHint>
            Kỳ tuần: chọn từ ngày – đến ngày, hệ thống tính kết quả theo khoảng đã chọn.
          </PeriodHint>
        ) : (
          <GuardText>
            Guard: tổng trọng số các chỉ tiêu trong cùng kỳ của một thành viên phải bằng 100%.
          </GuardText>
        )}
      </DrawerForm>
    </KpiDrawer>
  );
};


export default IndicatorDrawer;
