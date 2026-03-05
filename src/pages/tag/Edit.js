import { useState, useCallback, useContext } from 'react';
import { Row, Col, message, Form } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useEffectAsync } from '@/hooks/MyHooks';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import RestEditModal from '@/components/RestLayout/RestEditModal';
import FormHidden from '@/components/form/FormHidden';
import FormInput from '@/components/form/FormInput';
import FormTextArea from '@/components/form/FormTextArea';
import RequestUtils, { SUCCESS_CODE } from '@/utils/RequestUtils';
import { useQueryParams } from '@/hooks/useQueryParams';
import { useNavigateSearch } from '@/hooks/useNavigateSearch';
import { FormContextCustom } from '@/components/context/FormContextCustom';
import CustomButton from '@/components/CustomButton';

const TagEdit = () => {
  const { get } = useQueryParams();
  const navigate = useNavigateSearch();
  const id = get('id');

  const [tag, setTag] = useState({});
  const [formInstance] = Form.useForm();
  const [localTags, setLocalTags] = useState([]);


  useEffectAsync(
    async () => {
      if (!id) {
        setTag({});
        return;
      }
      const { data, errorCode } = await RequestUtils.Get('/tag/find-by-id', { id });
      if (errorCode === SUCCESS_CODE) {
        setTag(data || {});
      }
    },
    [id],
    () => {
      setTag({});
    }
  );

  const onSubmit = useCallback(
    async (values) => {
      const body = id ? { id, ...values } : values;
      const { message: MSG, data, errorCode } = await RequestUtils.Post('/tag/save', body);
      if (errorCode === SUCCESS_CODE && data) {
        setTag(data);
        if (!id) {
          formInstance.resetFields();
          setTag({});
          navigate('/tag/edit');
        }
      }
      message.info(MSG);
    },
    [id, formInstance, navigate]
  );

  // Xem trước tag
  const handleAgree = useCallback(() => {
    formInstance.validateFields().then(values => {
      setLocalTags(pre => [...pre, values]);
      formInstance.resetFields();
    }).catch(() => {});
  }, [formInstance]);

  // Xoá tag khỏi preview
  const handleRemoveTag = useCallback((idx) => {
    setLocalTags(pre => pre.filter((_, i) => i !== idx));
  }, []);

  // Tạo slug từ tag name
  const makeSlug = (text = '') => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // form 
  const TagFormContent = () => {
    const { form } = useContext(FormContextCustom);

    // Tự động tạo slug khi nhập tên tag
    const handleNameChange = (e) => {
      const nameVal = e.target.value;
      const slugVal = makeSlug(nameVal);
      form.setFieldsValue({ slug: slugVal });
    };

    return (
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col md={24} xs={24}>
          <FormHidden name="id" />
        </Col>

        <Col md={12} xs={24}>
          <FormInput
            label="Tên tag"
            name="name"
            placeholder="Nhập tên"
            onChange={handleNameChange}
          />
          <FormInput
            label="Slug"
            name="slug"
            placeholder="Nhập slug"
          />
          <FormTextArea
            label="Mô tả"
            name="description"
            placeholder="Nhập mô tả"
          />
          <Form.Item label="Màu" name="color" initialValue="#000000">
            <input type="color" style={{ width: 32, height: 32, border: 'none', padding: 0 }} />
          </Form.Item>
          <Form.Item>
            <div style={{
                display: "flex",
                justifyContent:"space-between"
            }}>  
              <CustomButton
                style={{ marginLeft: 8 }}
                type="default"
                onClick={handleAgree}
                title="Xem trước"
              />
              <CustomButton type="primary" htmlType="submit" title="Lưu tag" />
            </div>
          </Form.Item>
        </Col>

        <Col md={12} xs={24} style={{ padding: 16, border: '1px solid #f0f0f0' }}>
          {localTags.length === 0 ? (
            <div style={{ color: '#999' }}>Thêm tag để xem trước</div>
          ) : (
            localTags.map((t, idx) => (
              <div
                key={idx}
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  backgroundColor: t.color || '#ccc',
                  color: '#fff',
                  borderRadius: 4,
                  marginRight: 4,
                  marginBottom: 4,
                  position: 'relative',
                }}
              >
                {t.name || '-'}
                <CloseOutlined
                  onClick={() => handleRemoveTag(idx)}
                  style={{
                    marginLeft: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                />
              </div>
            ))
          )}
        </Col>
      </Row>
    );
  };

  return (
    <>
      <Helmet>
        <title>{id ? 'Sửa tag' : 'Thêm mới tag'}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[
          { title: 'Trang chủ' },
          { title: 'Tag' },
          { title: tag?.name ?? (id ? '...' : 'Thêm mới tag') },
        ]}
      />
      <RestEditModal
        form={formInstance}
        record={tag}
        updateRecord={(values) => setTag((prev) => ({ ...prev, ...values }))}
        onSubmit={onSubmit}
      >
        <TagFormContent />
      </RestEditModal>
    </>
  );
};

export default TagEdit;