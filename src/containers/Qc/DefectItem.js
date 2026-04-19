import React, { useCallback } from 'react';
import axios from 'axios';
import { Button, Col, Image, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { FormListStyles } from '@/css/global';
import { GATEWAY } from 'configs';
import { getStaticImageUrl } from 'utils/tools';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('files', file);
  formData.append('folder', 'qc-defect');

  const response = await axios.post(
    `${GATEWAY}/upload/folder/multiple`,
    formData,
    {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );

  const payload = response?.data || {};
  const files = [
    ...(Array.isArray(payload?.files) ? payload.files : []),
    ...(Array.isArray(payload?.data?.files) ? payload.data.files : [])
  ].filter(Boolean);
  const [url] = files;
  if (!url) {
    throw new Error(payload?.message || payload?.data?.message || 'Không upload được ảnh');
  }
  return url;
};

const DefectItem = ({
  field,
  form,
  defectOptions = [],
  loading = false,
  hasMore = false,
  onSearchDefect,
  onLoadMoreDefect,
  onSelectDefect,
  formatDefectText
}) => {
  const imageUrl = form?.getFieldValue(['defects', field.name, 'imageUrl']);

  const onUploadImage = useCallback(async ({ file, onSuccess, onError }) => {
    try {
      const url = await uploadImage(file);
      form?.setFieldValue(['defects', field.name, 'imageUrl'], url);
      onSuccess && onSuccess({ url }, file);
    } catch (error) {
      InAppEvent.normalError(error?.message || 'Upload ảnh thất bại');
      onError && onError(error);
    }
  }, [field.name, form]);

  return (
    <FormListStyles gutter={[16, 16]}>
      <FormHidden name={[field.name, 'idQcDefect']} />
      <FormHidden name={[field.name, 'defectCode']} />
      <FormHidden name={[field.name, 'defectName']} />
      <FormHidden name={[field.name, 'severity']} />
      <FormHidden name={[field.name, 'productCode']} />

      <Col md={24} xs={24}>
        <FormSelect
          required
          name={[field.name, 'idQcDefect']}
          label="Lỗi"
          placeholder="Chọn lỗi đã có"
          resourceData={defectOptions}
          valueProp="idQcDefect"
          titleProp="defectName"
          loading={loading}
          enableWaypoint={hasMore}
          onEnter={onLoadMoreDefect}
          onSearch={onSearchDefect}
          showSearch
          isFilterOption={false}
          filterOption={false}
          formatText={formatDefectText}
          onChangeGetSelectedItem={(_, item) => onSelectDefect?.(field.name, item)}
        />
      </Col>

      <Col md={12} xs={24}>
        <FormInput
          required
          name={[field.name, 'quantity']}
          label="Số lượng"
          placeholder="Số lượng"
        />
      </Col>

      <Col md={12} xs={24}>
        <Upload
          customRequest={onUploadImage}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />}>Thêm ảnh</Button>
        </Upload>
      </Col>

      {imageUrl ? (
        <Col md={24} xs={24}>
          <Image src={getStaticImageUrl(imageUrl)} width={72} height={72} style={{ objectFit: 'cover', borderRadius: 6 }} />
        </Col>
      ) : null}

      <Col md={24} xs={24}>
        <FormTextArea
          name={[field.name, 'description']}
          label="Mô tả lỗi"
          placeholder="Chỉnh sửa mô tả nếu cần"
          rows={2}
        />
      </Col>
    </FormListStyles>
  );
};

export default DefectItem;
