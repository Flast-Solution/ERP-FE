import { Col, Row } from 'antd'
import { FormOutlined } from '@ant-design/icons'
import {
  FormAutoComplete,
  FormCheckbox,
  FormDatePicker,
  FormHidden,
  FormInput,
  FormInputNumber,
  FormJoditEditor,
  FormRadioGroup,
  FormSelect,
  FormSelectAPI,
  FormTextArea,
} from '@flast-erp/core/components'

import FormFileUpload from './FormFileUpload'

const getValueByDataExpression = (item, expression = '') => {
  const path = String(expression)
    .trim()
    .replace(/^data\??\.?/, '')
    .split(/\??\./)
    .map(part => part.trim())
    .filter(Boolean)

  if (path.length === 0) return undefined
  return path.reduce((value, key) => value?.[key], item)
}

const createSelectApiOnData = (dataLabel, dataValue) => {
  if (!dataLabel || !dataValue) return undefined
  return response => (Array.isArray(response) ? response : (response?.data ?? [])).map(data => ({
    label: getValueByDataExpression(data, dataLabel),
    value: getValueByDataExpression(data, dataValue),
  }))
}

const FieldPreview = ({ field }) => {
  const { inputType, fieldKey, label, isRequired, config: rawConfig, children = [] } = field
  const config = rawConfig ?? {}
  const placeholder = config.placeholder ?? ''
  const required = isRequired
  const opts = (config.options ?? []).map(option => ({
    id: option.id ?? option.value,
    name: option.name ?? option.label ?? option.value ?? option.id,
  }))

  switch (inputType) {
    case 'hidden':
      return <FormHidden name={fieldKey} />

    case 'block':
      return (
        <div
          style={{
            border: '1px dashed #d9d9d9',
            background: '#fff',
            borderRadius: 6,
            padding: 16,
            marginBottom: 16,
            minHeight: children.length > 0 ? undefined : 220,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: children.length > 0 ? 'flex-start' : 'center',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#1f1f1f' }}>
            {label || 'Block'}
          </div>
          {children.length > 0 ? (
            <Row gutter={[16, 0]} style={{ marginTop: 12 }}>
              {children.map(child => (
                <Col key={child._id ?? child.fieldKey} span={child.colSpan ?? 24}>
                  <FieldPreview field={child} />
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: 'center', color: '#bfbfbf', marginTop: 24 }}>
              <FormOutlined style={{ fontSize: 44, marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: '#8c8c8c' }}>Kéo field vào đây để bắt đầu</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Chọn loại field từ danh sách bên trái</div>
            </div>
          )}
        </div>
      )

    case 'text':
      return <FormInput name={fieldKey} label={label} required={required} placeholder={placeholder || label} />

    case 'textarea':
      return (
        <FormTextArea
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || label}
          rows={3}
        />
      )

    case 'number':
      return (
        <FormInputNumber
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder}
          min={config.min ?? undefined}
          max={config.max ?? undefined}
          precision={0}
          style={{ width: '100%' }}
        />
      )

    case 'decimal':
      return (
        <FormInputNumber
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder}
          min={config.min ?? undefined}
          max={config.max ?? undefined}
          precision={2}
          style={{ width: '100%' }}
        />
      )

    case 'date':
      return <FormDatePicker name={fieldKey} label={label} required={required} style={{ width: '100%' }} />

    case 'datetime':
      return (
        <FormDatePicker
          name={fieldKey}
          label={label}
          required={required}
          showTime
          style={{ width: '100%' }}
        />
      )

    case 'select':
      return (
        <FormSelect
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Chọn...'}
          resourceData={opts}
          valueProp="value"
          titleProp="label"
        />
      )

    case 'multi_select':
      return (
        <FormSelect
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Chọn nhiều...'}
          resourceData={opts}
          valueProp="value"
          titleProp="label"
          mode="multiple"
        />
      )

    case 'radio':
      return (
        <FormRadioGroup
          name={fieldKey}
          label={label}
          required={required}
          options={config.options ?? []}
          valueProp="value"
          titleProp="label"
        />
      )

    case 'checkbox':
      return (
        <FormCheckbox
          name={fieldKey}
          label={label}
          required={required}
          text={config.options?.[0]?.label}
        />
      )

    case 'file':
      return (
        <FormFileUpload
          name={fieldKey}
          label={label}
          required={required}
          accept={/^image\/\*$/i.test(String(config.accept ?? '').trim()) ? undefined : (config.accept ?? undefined)}
          folder={config.folder ?? 'test'}
          maxSizeMB={config.maxSize}
        />
      )

    case 'image':
      return (
        <FormFileUpload
          name={fieldKey}
          label={label}
          required={required}
          accept={config.accept ?? 'image/*'}
          folder={config.folder ?? 'test'}
          image
          maxSizeMB={config.maxSize}
        />
      )

    case 'richtext':
      return <FormJoditEditor name={fieldKey} label={label} required={required} />

    case 'lookup':
      return (
        <FormSelectAPI
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Tìm kiếm...'}
          entity={config.entity ?? ''}
          titleProp={config.labelField ?? 'name'}
          searchKey={config.labelField ?? 'name'}
        />
      )

    case 'select_api':
      return (
        <FormSelectAPI
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Tìm kiếm...'}
          apiPath={config.api ?? undefined}
          entity={config.entity ?? ''}
          valueProp={config.dataLabel && config.dataValue ? 'value' : (config.valueProp ?? 'id')}
          titleProp={config.dataLabel && config.dataValue ? 'label' : (config.titleProp ?? config.labelField ?? 'name')}
          searchKey={config.labelField ?? config.titleProp ?? 'name'}
          onData={createSelectApiOnData(config.dataLabel, config.dataValue)}
        />
      )

    case 'autocomplete':
      return (
        <FormAutoComplete
          name={fieldKey}
          label={label}
          required={required}
          placeholder={placeholder || 'Nhập để tìm...'}
          resourceData={config.options ?? []}
          valueProp={config.valueProp ?? 'value'}
          titleProp={config.titleProp ?? 'label'}
        />
      )

    default:
      return <FormInput name={fieldKey} label={label} required={required} placeholder={placeholder || label} />
  }
}

export default FieldPreview
