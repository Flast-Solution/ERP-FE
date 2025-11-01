import { useState } from 'react';
import { Form, DatePicker, ColorPicker, Row, Col, Slider, Button, Flex } from 'antd';
import FormInput from 'components/form/FormInput';
import FormSelect from 'components/form/FormSelect';
import FormTextArea from 'components/form/FormTextArea';
import { PROJECT_TASK_STATUS_LIST } from 'configs/localData';
import { isEmpty } from 'lodash';
import { useEffectAsync } from 'hooks/MyHooks';
import dayjs from 'dayjs';
import FormSelectInfiniteBusinessUser from 'components/form/SelectInfinite/FormSelectInfiniteBusinessUser';

const { RangePicker } = DatePicker;
const TaskForm = ({ 
  record,
  onSave,
  onDelete,
  closeModal 
}) => {

  const [ taskIdentity, setIdentity ] = useState();
  const [ form ] = Form.useForm();
  const onFinish = async (values) => {
    const newIdentity = await onSave(taskIdentity, values);
    setIdentity(newIdentity);
  }

  useEffectAsync(async () => {
    setIdentity(record?.id || '');
    if(isEmpty(record)) {
      return;
    }
    const progress = record?.extendedProps?.progress || 0;
    const ssoId = record?.extendedProps?.ssoId;
    const status = record?.extendedProps?.status || PROJECT_TASK_STATUS_LIST[0];

    form.setFieldsValue({
      progress,
      ssoId,
      status,
      title: record.title,
      description: record?.extendedProps?.description,
      color: record.backgroundColor,
      dateRange: [dayjs(record.start), dayjs(record.end)]
    });
  }, [record, form]);

  const handleCancel = () => {
    form.resetFields();
    closeModal();
  };

  const handleDelete = (id) => {
    form.resetFields();
    closeModal();
    onDelete(id);
  };

  const ACTIONS = [
    record?.id && (
      <Button key="delete" danger onClick={() => handleDelete(record.id)}> Xóa </Button>
    ),
    <Button key="cancel" onClick={handleCancel}> Hủy </Button>,
    <Button key="submit" type="primary" htmlType='submit'>
      {record?.id ? "Cập nhật" : "Thêm"}
    </Button>
  ];

  return (
    <Form
      form={form}
      onFinish={onFinish}
      layout="vertical"
      initialValues={{ color: '#1890ff' }}
    >
      <Row gutter={24}>
        <Col md={12} xs={24}>
          <FormInput
            name="title"
            label="Tiêu đề"
            placeholder="Nhập tiêu đề sự kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectInfiniteBusinessUser 
            required
            label='Phụ trách công việc'
            placeholder="Chọn người phụ trách"
            name='ssoId'
            valueProp='ssoId'
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea 
            name="description"
            label="Mô tả"
            placeholder="Nhập mô tả sự kiện" 
            rows={3}
          />
        </Col>
        <Col md={24} xs={24}>
          <Form.Item
            name="dateRange"
            label="Thời gian"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
          >
            <RangePicker 
              showTime 
              format="DD/MM/YYYY HH:mm"
              className="w-full"
            />
          </Form.Item>
        </Col>
        <Col md={8} xs={24}>
          <FormSelect 
            name="status"
            required
            resourceData={PROJECT_TASK_STATUS_LIST.map(item => ({name: item}))}
            valueProp='name'
            label="Trạng thái"
            placeholder="Chọn trạng thái"
          />
        </Col>
        <Col md={8} xs={24}>
          <Form.Item
            required
            name="progress"
            label="Tiến độ"
          >
            <Slider marks={{ 0: '0%', 100: '100%' }} />
          </Form.Item>
        </Col>
        <Col md={8} xs={24}>
          <Form.Item
            name="color"
            label="Màu sắc"
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker showText format="hex" />
          </Form.Item>
        </Col>
        <Col md={24} xs={24}>
          <Flex gap={12} justify='flex-end'>
            { ACTIONS }
          </Flex>
        </Col>
      </Row>
    </Form>
  )
}

export default TaskForm;