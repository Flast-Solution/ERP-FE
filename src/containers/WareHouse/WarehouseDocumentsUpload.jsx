import React, { useState } from 'react';
import { Form, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import {
  extractUploadItems,
  normalizeUploadFileName,
  resolveUploadFilename,
  toUploadFile,
} from '../PreviewModal/uploadUtils';
import UploadedFilePreview from '../../components/UploadedFilePreview';

const WarehouseDocumentsUpload = ({ onChange, onUploadingChange, disabled = false }) => {
  const form = Form.useFormInstance();
  const attachments = Form.useWatch('attachments', form) ?? [];
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileList = attachments.map(toUploadFile).filter(Boolean);

  const uploadBatch = async files => {
    const selectedFiles = Array.from(files).filter(Boolean);
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append(
        'files',
        file,
        normalizeUploadFileName(file?.name) || file?.name
      );
    });
    formData.append('folder', 'warehouse');

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const response = await axios.post('/erp/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploaded = extractUploadItems(response.data);
      if (uploaded.length === 0) throw new Error('API upload không trả về tệp');
      form.setFieldValue('attachments', [...(form.getFieldValue('attachments') ?? []), ...uploaded]);
      onChange?.();
      message.success(`Đã tải lên ${uploaded.length} tệp`);
    } catch (error) {
      message.error(error?.message || 'Upload chứng từ thất bại');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <Form.Item label="Tải giấy tờ">
      <Upload.Dragger
        multiple
        fileList={fileList}
        disabled={uploading || disabled}
        onPreview={file => setPreviewFile(file)}
        beforeUpload={(file, selectedFiles) => {
          if (file === selectedFiles[0]) uploadBatch(selectedFiles);
          return Upload.LIST_IGNORE;
        }}
        onRemove={file => {
          const removed = resolveUploadFilename(file);
          form.setFieldValue(
            'attachments',
            attachments.filter(item => resolveUploadFilename(item) !== removed)
          );
          onChange?.();
        }}
      >
        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
        <p className="ant-upload-text">
          {uploading ? 'Đang tải chứng từ...' : 'Kéo file vào đây hoặc bấm để chọn'}
        </p>
        <p className="ant-upload-hint">Có thể chọn và tải nhiều file trong một lần</p>
      </Upload.Dragger>
      <Form.Item name="attachments" hidden><input type="hidden" /></Form.Item>
      <UploadedFilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </Form.Item>
  );
};

export default WarehouseDocumentsUpload;
