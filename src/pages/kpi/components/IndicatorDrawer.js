import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { CloseOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { MOCK_EMPLOYEES } from '../mockData';
import useUserOptions from '../hooks/useUserOptions';
import { CancelButton, DeleteButton, DrawerCloseButton, DrawerEyebrow, DrawerFooter, DrawerForm, DrawerHeading, DrawerOwner, DrawerTitle, FooterActions, FormGrid, FullDatePicker, FullSegmented, GuardText, KpiDrawer, PeriodHint, SaveButton } from './IndicatorDrawer.styles';

const IndicatorDrawer = ({ drawer, onClose }) => {
  const [form] = Form.useForm();
  const frequency = Form.useWatch('frequency', form) || 'quarter';
  const assignee = Form.useWatch('assignee', form);
  const isEdit = drawer.mode === 'edit';
  const indicator = drawer.indicator;
  const employee = drawer.employee || MOCK_EMPLOYEES[0];
  const { userLoadError, userLoading, userOptions } = useUserOptions(drawer.open);
  const assigneeName = userOptions.find(
    (option) => String(option.value) === String(assignee),
  )?.label || employee.name;

  useEffect(() => {
    if (!drawer.open) return;

    form.setFieldsValue({
      code: 'KPI-QC-01',
      name: isEdit ? indicator?.name : '',
      description: isEdit ? indicator?.description : '',
      unit: isEdit ? indicator?.unit : 'mẫu / quý',
      weight: isEdit ? indicator?.weight : 25,
      target: isEdit
        ? ({ samples_completed: 180, avg_turnaround: 36, retest_rate: 5, sop_compliance: 90 }[indicator?.id] || 180)
        : 180,
      direction: indicator?.id === 'avg_turnaround' || indicator?.id === 'retest_rate' ? 'max' : 'min',
      frequency: 'quarter',
      startDate: dayjs('2026-08-17'),
      endDate: dayjs('2026-08-23'),
      month: '8',
      quarter: '2',
      year: dayjs('2026-01-01'),
      assignee: employee.id,
    });
  }, [drawer.open, employee.id, form, indicator, isEdit]);

  useEffect(() => {
    if (!drawer.open || !userOptions.length) return;

    const assignee = form.getFieldValue('assignee');
    const hasCurrentAssignee = userOptions.some(
      (option) => String(option.value) === String(assignee),
    );

    if (!hasCurrentAssignee) {
      form.setFieldValue('assignee', userOptions[0].value);
    }
  }, [drawer.open, form, userOptions]);

  const handleSave = async () => {
    await form.validateFields();
    onClose();
  };

  const handleFrequencyChange = (value) => {
    const periodDefaults = {
      week: {
        startDate: dayjs('2026-08-17'),
        endDate: dayjs('2026-08-23'),
      },
      month: { month: '8', year: dayjs('2026-01-01') },
      quarter: { quarter: '2', year: dayjs('2026-01-01') },
      year: { year: dayjs('2026-01-01') },
    };

    form.setFieldsValue({ frequency: value, ...periodDefaults[value] });
  };

  const renderEvaluationPeriod = () => {
    if (frequency === 'week') {
      return (
        <FormGrid>
          <Form.Item
            label="Từ ngày"
            name="startDate"
            rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}
          >
            <FullDatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
          <Form.Item
            label="Đến ngày"
            name="endDate"
            dependencies={['startDate']}
            rules={[
              { required: true, message: 'Chọn ngày kết thúc' },
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
          >
            <FullDatePicker format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
        </FormGrid>
      );
    }

    if (frequency === 'month') {
      return (
        <FormGrid>
          <Form.Item label="Tháng" name="month" rules={[{ required: true, message: 'Chọn tháng' }]}>
            <Select options={Array.from({ length: 12 }, (_, index) => ({
              value: String(index + 1),
              label: `Tháng ${index + 1}`,
            }))} />
          </Form.Item>
          <YearField />
        </FormGrid>
      );
    }

    if (frequency === 'year') {
      return <YearField />;
    }

    return (
      <FormGrid>
        <Form.Item label="Quý" name="quarter" rules={[{ required: true, message: 'Chọn quý' }]}>
          <Select options={[
            { value: '1', label: 'Quý 1' },
            { value: '2', label: 'Quý 2' },
            { value: '3', label: 'Quý 3' },
            { value: '4', label: 'Quý 4' },
          ]} />
        </Form.Item>
        <YearField />
      </FormGrid>
    );
  };

  const YearField = () => (
    <Form.Item label="Năm" name="year" rules={[{ required: true, message: 'Chọn năm' }]}>
      <FullDatePicker picker="year" format="YYYY" placeholder="Chọn năm" />
    </Form.Item>
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
          <DrawerOwner>Người phụ trách: {assigneeName}</DrawerOwner>
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
            <SaveButton type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              Lưu chỉ tiêu
            </SaveButton>
          </FooterActions>
        </DrawerFooter>
      )}
    >
      <DrawerForm form={form} layout="vertical" requiredMark>
        <FormGrid>
          <Form.Item
            label="Mã chỉ tiêu"
            name="code"
            rules={[{ required: true, message: 'Nhập mã chỉ tiêu' }]}
          >
            <Input disabled placeholder="KPI-QC-01" />
          </Form.Item>
          <Form.Item
            label="Tên chỉ tiêu"
            name="name"
            rules={[{ required: true, message: 'Nhập tên chỉ tiêu' }]}
          >
            <Input placeholder="VD: Số mẫu kiểm định hoàn thành" />
          </Form.Item>
        </FormGrid>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea
            rows={4}
            placeholder="Giải thích ngắn gọn cách đo và ý nghĩa chỉ tiêu"
          />
        </Form.Item>

        <FormGrid>
          <Form.Item
            label="Đơn vị đo"
            name="unit"
            rules={[{ required: true, message: 'Chọn đơn vị đo' }]}
          >
            <Select options={[
              { value: 'mẫu / quý', label: 'mẫu / quý' },
              { value: 'giờ / mẫu', label: 'giờ / mẫu' },
              { value: '%', label: '%' },
              { value: 'điểm audit', label: 'điểm audit' },
            ]} />
          </Form.Item>
          <Form.Item
            label="Trọng số (%)"
            name="weight"
            rules={[{ required: true, message: 'Nhập trọng số' }]}
          >
            <InputNumber min={1} max={100} />
          </Form.Item>
        </FormGrid>

        <FormGrid>
          <Form.Item
            label="Mục tiêu"
            name="target"
            rules={[{ required: true, message: 'Nhập mục tiêu' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            label="Hướng mục tiêu"
            name="direction"
            rules={[{ required: true, message: 'Chọn hướng mục tiêu' }]}
          >
            <Select options={[
              { value: 'min', label: 'Đạt tối thiểu (càng cao càng tốt)' },
              { value: 'max', label: 'Không vượt quá (càng thấp càng tốt)' },
            ]} />
          </Form.Item>
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

        <Form.Item
          label="Người phụ trách"
          name="assignee"
          rules={[{ required: true, message: 'Chọn người phụ trách' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={userLoading}
            options={userOptions}
            placeholder={userLoading ? 'Đang tải danh sách người dùng...' : 'Chọn người phụ trách'}
            notFoundContent={userLoadError ? 'Không tải được danh sách người dùng' : 'Không có người dùng'}
          />
        </Form.Item>

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
