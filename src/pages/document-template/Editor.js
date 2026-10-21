import React, { useEffect, useState } from 'react';
import './editor.css';
import { Alert, Col, Form, Input, message, Row, Select, Spin } from 'antd';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DocumentTemplateEditor, {
  createEmptyTemplate,
} from '@erp/shared-ui/components/DocumentTemplateEditor/index';
import { SUCCESS_CODE } from '@/configs';
import DocumentTemplateService, {
  buildDocumentSchemaFromEntityFields,
  normalizeDocumentSchema,
  normalizeDocumentType,
  parseDocumentTemplateData,
  resolveDocumentTemplateType,
} from '@/services/DocumentTemplateService';

const DocumentTemplateEditorPage = () => {
  const navigate = useNavigate();
  const [metadataForm] = Form.useForm();
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const sourceTemplateId = searchParams.get('sourceTemplateId');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [record, setRecord] = useState(null);
  const [sourceTemplate, setSourceTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [schema, setSchema] = useState(null);
  const [dataSchema, setDataSchema] = useState([]);
  const [previewData, setPreviewData] = useState({});
  const [initialTemplate, setInitialTemplate] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadEditor = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const requestedTemplateId = templateId || sourceTemplateId;
        const [entityFields, templateResponse] = await Promise.all([
          DocumentTemplateService.fetchAllEntities(),
          DocumentTemplateService.fetchTemplates(),
        ]);
        if (
          Number(templateResponse?.errorCode) !== SUCCESS_CODE ||
          !Array.isArray(templateResponse?.data)
        ) {
          throw new Error(templateResponse?.message || 'Không tải được danh sách template');
        }
        if (!mounted) return;
        setTemplates(templateResponse.data);
        if (!Array.isArray(entityFields)) {
          throw new Error('API /erp/template/all-entities không trả về mảng dữ liệu');
        }

        // Tạo mới: mở designer trống, không cần chọn hạng mục
        if (!requestedTemplateId) {
          if (!mounted) return;
          const schemaData = buildDocumentSchemaFromEntityFields(entityFields, {
            code: null,
            name: 'Mẫu chứng từ',
          });
          metadataForm.setFieldsValue({ version: metadataForm.getFieldValue('version') || '' });
          setRecord(null);
          setSourceTemplate(null);
          setSchema(schemaData);
          setDataSchema(normalizeDocumentSchema(schemaData));
          setPreviewData({});
          setInitialTemplate(
            createEmptyTemplate({ name: 'Mẫu chứng từ', documentType: 'quotation' }),
          );
          return;
        }

        const templateSource = templateResponse.data.find(
          (item) => String(item.templateId) === String(requestedTemplateId),
        );
        if (!templateSource) throw new Error('Không tìm thấy template đã chọn');
        if (!mounted) return;

        const schemaData = {
          ...buildDocumentSchemaFromEntityFields(entityFields, {
            code: templateSource.code,
            name: templateSource.name,
          }),
          schemaVersion: templateSource.version,
        };
        const storedTemplate =
          templateSource.data == null || templateSource.data === ''
            ? null
            : parseDocumentTemplateData(
                templateSource.data,
                'Dữ liệu template không hợp lệ. Không thể mở mẫu trống để ghi đè dữ liệu đã lưu.',
              );

        setRecord(templateId ? templateSource : null);
        setSourceTemplate(templateSource);
        setSchema(schemaData);
        setDataSchema(normalizeDocumentSchema(schemaData));
        setPreviewData({});
        const resolvedDocumentType = normalizeDocumentType(
          resolveDocumentTemplateType(templateSource),
        );
        metadataForm.setFieldsValue({
          version: templateId
            ? templateSource.version == null
              ? ''
              : String(templateSource.version)
            : metadataForm.getFieldValue('version') || '',
        });
        const normalizedStoredTemplate = storedTemplate
          ? {
              ...storedTemplate,
              documentType: resolvedDocumentType,
            }
          : null;
        setInitialTemplate(
          normalizedStoredTemplate ||
            createEmptyTemplate({
              name: templateSource.name,
              documentType: resolvedDocumentType,
            }),
        );
      } catch (error) {
        if (mounted) setLoadError(error?.message || 'Không thể mở trình thiết kế chứng từ');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEditor();
    return () => {
      mounted = false;
    };
  }, [sourceTemplateId, templateId, metadataForm]);

  const handleSave = async (template) => {
    let metadata;
    try {
      metadata = await metadataForm.validateFields();
    } catch {
      return;
    }
    const templateData = { ...template };
    delete templateData.documentType;
    const payload = {
      templateId: record?.templateId ?? null,
      sourceTemplateId: record ? null : sourceTemplate?.templateId,
      code: record?.code ?? null,
      name: template.name,
      version: metadata.version.trim(),
      fields: Array.isArray(sourceTemplate?.fields) ? sourceTemplate.fields : [],
      status: record?.status ?? 1,
      bizId: sourceTemplate?.bizId ?? null,
      documentType: normalizeDocumentType(
        resolveDocumentTemplateType(record || sourceTemplate) || template.documentType,
      ),
      data: JSON.stringify(templateData),
    };
    setSaving(true);
    try {
      const response = await DocumentTemplateService.saveTemplate(payload);
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Lưu chứng từ thất bại');
      }
      message.success(response?.message || 'Lưu chứng từ thành công');
      const savedId = response?.data?.templateId || record?.templateId;
      if (!record?.templateId && savedId) {
        navigate(`/system/document-templates/${savedId}/edit`, { replace: true });
      }
    } catch (error) {
      message.error(error?.message || 'Lưu chứng từ thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: 480, display: 'grid', placeItems: 'center' }}>
        <Spin tip="Đang tải cấu hình chứng từ" />
      </div>
    );
  }
  if (loadError) {
    return (
      <Alert type="error" showIcon message="Không thể mở trình thiết kế" description={loadError} />
    );
  }

  return (
    <>
      <Helmet>
        <title>{record?.name || initialTemplate?.name || 'Tạo chứng từ'}</title>
      </Helmet>
      <Form
        form={metadataForm}
        component="div"
        layout="vertical"
        disabled={saving}
        style={{ padding: '16px 20px 0', marginBottom: 16, background: '#fff', borderRadius: 8 }}
      >
        <Row gutter={16}>
          {!templateId && (
            <Col xs={24} md={12}>
              <Form.Item
                label="Chọn mẫu có sẵn"
                extra="Chọn mẫu để nạp thiết kế làm mẫu mới. Bố cục đang chỉnh sửa sẽ được thay thế."
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  placeholder="Tạo mẫu trống hoặc chọn mẫu có sẵn"
                  value={sourceTemplate?.templateId}
                  options={templates.map((item) => ({
                    value: item.templateId,
                    label: `${item.name || item.code || item.templateId}${item.version != null ? ` — v${item.version}` : ''} (#${item.templateId})`,
                  }))}
                  onChange={(value) =>
                    navigate(
                      value == null
                        ? '/system/document-templates/create'
                        : `/system/document-templates/create?sourceTemplateId=${encodeURIComponent(value)}`,
                      { replace: true },
                    )
                  }
                />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} md={12}>
            <Form.Item
              name="version"
              label="Phiên bản (version)"
              rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập phiên bản' }]}
            >
              <Input placeholder="Ví dụ: 1.0" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <div className="document-template-editor-page">
        <DocumentTemplateEditor
          key={record?.templateId || sourceTemplate?.templateId}
          documentType={schema?.category?.code}
          initialTemplate={initialTemplate}
          dataSchema={dataSchema}
          sampleData={previewData}
          saving={saving}
          onSave={handleSave}
          onCancel={() => navigate('/system/document-templates')}
        />
      </div>
    </>
  );
};

export default DocumentTemplateEditorPage;
