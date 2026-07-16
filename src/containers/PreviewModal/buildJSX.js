/**
 * buildJSX.js
 *
 * Sinh 2 string song song từ schema:
 *   plain  — text thuần cho clipboard
 *   html   — string có <span class="tk-*"> cho syntax highlight
 *
 * Output dùng @flast-erp/core/components + antd Row/Col theo colSpan.
 *
 * Ví dụ output:
 *   import React from 'react'
 *   import { FormInput, FormRadioGroup } from '@flast-erp/core/components'
 *   import { Form, Row, Col } from 'antd'
 *
 *   const FormView = () => {
 *     const [form] = Form.useForm()
 *     return (
 *       <Form form={form} layout="vertical" onFinish={values => console.log(values)}>
 *         <Row gutter={[16, 0]}>
 *           <Col span={12}>
 *             <FormInput name="weight_gsm" label="Định lượng (g/m²)" required />
 *           </Col>
 *           <Col span={12}>
 *             <FormRadioGroup
 *               name="result_grade"
 *               label="Cấp độ bền màu (1–5)"
 *               required
 *               options={[{ value: '5', label: '5 - Xuất sắc' }]}
 *             />
 *           </Col>
 *         </Row>
 *       </Form>
 *     )
 *   }
 *   export default FormView
 */

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function h(cls, text) {
  return `<span class="tk-${cls}">${esc(text)}</span>`
}

function normalizeDataExpression(expression = '') {
  return String(expression).trim()
}

function toComponentName(name = '') {
  const words = String(name)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const baseName = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')

  if (!baseName) {
    return 'FormView'
  }

  return /^[A-Z]/.test(baseName) ? baseName : `Form${baseName}`
}

/* ─── InputType → @flast-erp/core component name ────────────────────────────── */

const COMPONENT_MAP = {
  block       : 'FormBlockPreview',
  hidden      : 'FormHidden',
  text        : 'FormInput',
  textarea    : 'FormTextArea',
  number      : 'FormInputNumber',
  decimal     : 'FormInputNumber',
  date        : 'FormDatePicker',
  datetime    : 'FormDatePicker',
  select      : 'FormSelect',
  multi_select: 'FormSelect',
  radio       : 'FormRadioGroup',
  checkbox    : 'FormCheckbox',
  file        : 'FormFileUpload',
  image       : 'FormFileUpload',
  richtext    : 'FormJoditEditor',
  lookup      : 'FormSelectAPI',
  select_api  : 'FormSelectAPI',
  autocomplete: 'FormAutoComplete',
}

/* ─── Sinh props string cho từng type ───────────────────────────────────────── */

function buildProps(field) {
  const { inputType, fieldKey, label, isRequired, config: rawConfig } = field
  const config = rawConfig ?? {}
  const props = []   /* [{ key, value, kind }] — kind: 'str'|'expr'|'bare' */

  props.push({ key: 'name',  value: fieldKey, kind: 'str' })
  props.push({ key: 'label', value: label,    kind: 'str' })

  if (isRequired) {
    props.push({ key: 'required', kind: 'bare' })
  }

  if (config.placeholder) {
    props.push({ key: 'placeholder', value: config.placeholder, kind: 'str' })
  }

  switch (inputType) {
    case 'hidden':
      props.length = 0
      props.push({ key: 'name', value: fieldKey, kind: 'str' })
      break

    case 'block':
      props.length = 0
      props.push({ key: 'name', value: fieldKey, kind: 'str' })
      props.push({ key: 'title', value: label, kind: 'str' })
      break

    case 'decimal':
      props.push({ key: 'precision', value: '2', kind: 'expr' })
      if (config.min != null) props.push({ key: 'min', value: String(config.min), kind: 'expr' })
      if (config.max != null) props.push({ key: 'max', value: String(config.max), kind: 'expr' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'number':
      if (config.min != null) props.push({ key: 'min', value: String(config.min), kind: 'expr' })
      if (config.max != null) props.push({ key: 'max', value: String(config.max), kind: 'expr' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'datetime':
      props.push({ key: 'showTime', kind: 'bare' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'date':
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'select':
      if (config.options?.length) {
        props.push({ key: 'resourceData', value: config.options, kind: 'json' })
      }
      props.push({ key: 'valueProp', value: 'value', kind: 'str' })
      props.push({ key: 'titleProp', value: 'label', kind: 'str' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'multi_select':
      props.push({ key: 'mode', value: 'multiple', kind: 'str' })
      if (config.options?.length) {
        props.push({ key: 'resourceData', value: config.options, kind: 'json' })
      }
      props.push({ key: 'valueProp', value: 'value', kind: 'str' })
      props.push({ key: 'titleProp', value: 'label', kind: 'str' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'radio':
      if (config.options?.length) {
        props.push({ key: 'options', value: config.options, kind: 'json' })
      }
      props.push({ key: 'valueProp', value: 'value', kind: 'str' })
      props.push({ key: 'titleProp', value: 'label', kind: 'str' })
      break

    case 'checkbox':
      if (config.options?.[0]?.label) {
        props.push({ key: 'text', value: config.options[0].label, kind: 'str' })
      }
      break

    case 'lookup':
      if (config.entity)     props.push({ key: 'entity',     value: config.entity,               kind: 'str' })
      if (config.labelField) props.push({ key: 'titleProp',  value: config.labelField ?? 'name', kind: 'str' })
      if (config.labelField) props.push({ key: 'searchKey',  value: config.labelField ?? 'name', kind: 'str' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'select_api':
      {
        const dataLabel = normalizeDataExpression(config.dataLabel)
        const dataValue = normalizeDataExpression(config.dataValue)
        const hasDataMapping = Boolean(dataLabel && dataValue)

        if (config.api)    props.push({ key: 'apiPath', value: config.api,    kind: 'str' })
        if (config.entity) props.push({ key: 'entity',  value: config.entity, kind: 'str' })
        props.push({ key: 'valueProp', value: hasDataMapping ? 'value' : (config.valueProp ?? 'id'), kind: 'str' })
        props.push({ key: 'titleProp', value: hasDataMapping ? 'label' : (config.titleProp ?? config.labelField ?? 'name'), kind: 'str' })
        props.push({ key: 'searchKey', value: config.labelField ?? config.titleProp ?? 'name', kind: 'str' })
        if (hasDataMapping) {
          props.push({
            key: 'onData',
            value: `{(response) => (Array.isArray(response) ? response : (response?.data ?? [])).map((data) => ({ label: ${dataLabel}, value: ${dataValue} }))}`,
            kind: 'raw',
          })
        }
        props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      }
      break

    case 'autocomplete':
      if (config.options?.length) {
        props.push({ key: 'resourceData', value: config.options, kind: 'json' })
      }
      props.push({ key: 'valueProp', value: config.valueProp ?? 'value', kind: 'str' })
      props.push({ key: 'titleProp', value: config.titleProp ?? 'label', kind: 'str' })
      break

    case 'file':
      {
        const fileAccept = String(config.accept ?? '').trim()
        if (fileAccept && !/^image\/\*$/i.test(fileAccept)) {
          props.push({ key: 'accept', value: fileAccept, kind: 'str' })
        }
      }
      props.push({ key: 'folder', value: config.folder ?? 'test', kind: 'str' })
      if (config.maxSize != null) props.push({ key: 'maxSizeMB', value: String(config.maxSize), kind: 'expr' })
      break

    case 'image':
      props.push({ key: 'accept', value: config.accept ?? 'image/*', kind: 'str' })
      props.push({ key: 'folder', value: config.folder ?? 'test', kind: 'str' })
      props.push({ key: 'image', kind: 'bare' })
      if (config.maxSize != null) props.push({ key: 'maxSizeMB', value: String(config.maxSize), kind: 'expr' })
      break

    default:
      break
  }

  return props
}

/* ─── Render props → plain lines + html lines ───────────────────────────────── */

function renderProps(props, indent) {
  const plain = []
  const html  = []

  for (const prop of props) {
    const { key, value, kind } = prop

    if (kind === 'bare') {
      plain.push(`${indent}${key}`)
      html.push(`${indent}${h('attr', key)}`)
      continue
    }

    if (kind === 'str') {
      const line = `${indent}${key}="${value}"`
      plain.push(line)
      html.push(`${indent}${h('attr', key)}${h('punct', '=')}${h('string', `"${value}"`)}`)
      continue
    }

    if (kind === 'expr') {
      plain.push(`${indent}${key}={${value}}`)
      html.push(`${indent}${h('attr', key)}${h('punct', '={')}${h('number', value)}${h('punct', '}')}`)
      continue
    }

    if (kind === 'raw') {
      plain.push(`${indent}${key}=${value}`)
      html.push(`${indent}${h('attr', key)}${h('punct', '=')}${h('punct', value)}`)
      continue
    }

    if (kind === 'json') {
      const jsonStr = JSON.stringify(value, null, 2)
        .split('\n')
        .map((l, i) => i === 0 ? l : indent + '  ' + l)
        .join('\n')
      plain.push(`${indent}${key}={${jsonStr}}`)
      html.push(`${indent}${h('attr', key)}${h('punct', '={')}${syntaxHighlightJson(value)}${h('punct', '}')}`)
      continue
    }
  }

  return { plain, html }
}

/* ─── JSON mini-highlighter ──────────────────────────────────────────────────── */

function syntaxHighlightJson(obj) {
  return JSON.stringify(obj, null, 2)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g,  (_, k) => `${h('attr',   `"${k}"` )}:`)
    .replace(/: "([^"]*)"/g, (_, v) => `: ${h('string', `"${v}"`)}`)
    .replace(/: (\d+\.?\d*)/g, (_, v) => `: ${h('number',  v)}`)
    .replace(/: (true|false)/g, (_, v) => `: ${h('boolean', v)}`)
}

function getProvenance(field) {
  return field?._provenance ?? field?.config?.__provenance ?? null
}

function getProvenanceComment(field) {
  const provenance = getProvenance(field)
  if (!provenance) return ''

  const createdBy = provenance.createdBySource ?? provenance.source
  const updatedBy = provenance.updatedBySource
  const action = provenance.updatedAction ?? provenance.sourceAction

  if (updatedBy && updatedBy !== createdBy) {
    return `source: ${createdBy}; updated: ${updatedBy}${action ? `:${action}` : ''}`
  }

  return `source: ${createdBy}${action ? `; action: ${action}` : ''}`
}

/* ─── Field → JSX block (plain + html lines) ────────────────────────────────── */

function fieldToJSXLines(field, colIndent) {

  const component = COMPONENT_MAP[field.inputType] ?? 'FormInput'
  const props     = buildProps(field)
  const propIndent = colIndent + '  '

  const plain = []
  const html  = []

  const add = (p, h_) => { plain.push(p); html.push(h_) }
  const provenanceComment = getProvenanceComment(field)

  if (provenanceComment) {
    const comment = `{/* ${provenanceComment} */}`
    add(`${colIndent}${comment}`, `${colIndent}${h('comment', comment)}`)
  }

  if (field.inputType === 'block') {
    add(
      `${colIndent}<${component}`,
      `${colIndent}${h('tag', `<${component}`)}`
    )

    const { plain: pLines, html: hLines } = renderProps(props, propIndent)
    pLines.forEach((l, i) => add(l, hLines[i]))

    add(`${colIndent}>`, `${colIndent}${h('tag', '>')}`)
    add(`${colIndent}  <Row gutter={[16, 0]}>`, `${colIndent}  ${h('tag', '<Row')} ${h('attr', 'gutter')}${h('punct', '={[16, 0]}')}${h('tag', '>')}`)

    for (const child of field.children ?? []) {
      const span = child.colSpan ?? 24
      add(`${colIndent}    <Col span={${span}}>`, `${colIndent}    ${h('tag', '<Col')} ${h('attr', 'span')}${h('punct', `={${span}}`)}${h('tag', '>')}`)
      const { plain: childPlain, html: childHtml } = fieldToJSXLines(child, `${colIndent}      `)
      childPlain.forEach((line, idx) => add(line, childHtml[idx]))
      add(`${colIndent}    </Col>`, `${colIndent}    ${h('tag', '</Col>')}`)
    }

    add(`${colIndent}  </Row>`, `${colIndent}  ${h('tag', '</Row>')}`)
    add(`${colIndent}</${component}>`, `${colIndent}${h('tag', `</${component}>`)}`)
    return { plain, html }
  }

  if (props.length === 0) {
  /* self-closing 1 dòng */
    add(
      `${colIndent}<${component} />`,
      `${colIndent}${h('tag', `<${component}`)} ${h('tag', '/>')}`
    )
    return { plain, html }
  }

  /* opening tag */
  add(
    `${colIndent}<${component}`,
    `${colIndent}${h('tag', `<${component}`)}`
  )

  /* props */
  const { plain: pLines, html: hLines } = renderProps(props, propIndent)
  pLines.forEach((l, i) => add(l, hLines[i]))

  /* self-closing */
  add(`${colIndent}/>`, `${colIndent}${h('tag', '/>')}`)
  return { plain, html }
}

/* ─── Imports ────────────────────────────────────────────────────────────────── */

function buildImports(fields) {
  const used = new Set()
  let hasUpload = false
  const collect = (items = []) => {
    for (const item of items) {
      if (COMPONENT_MAP[item.inputType]) {
        used.add(COMPONENT_MAP[item.inputType])
      }
      if (item.inputType === 'file' || item.inputType === 'image') {
        hasUpload = true
      }
      collect(item.children ?? [])
    }
  }
  collect(fields)
  used.delete('FormBlockPreview')
  used.delete('FormFileUpload')

  const lines = [`import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'`]
  if (hasUpload) {
    lines.push(`import axios from 'axios'`)
  }
  const coreComponents = [...used].sort()
  if (coreComponents.length > 0) {
    lines.push(`import { ${coreComponents.join(', ')} } from '@flast-erp/core/components'`)
  }
  lines.push(`import { Form, Row, Col${hasUpload ? ', Upload, message' : ''} } from 'antd'`)

  return lines.join('\n')
}

function hasUploadField(fields = []) {
  return fields.some(field => (
    field.inputType === 'file'
    || field.inputType === 'image'
    || hasUploadField(field.children ?? [])
  ))
}

function buildUploadHelper(fields) {
  if (!hasUploadField(fields)) return ''

  return [
    `const extractUploadItems = (response) => {`,
    `  const payload = response?.data ?? response`,
    `  if (Array.isArray(payload)) return payload`,
    `  if (Array.isArray(payload?.data)) return payload.data`,
    `  if (Array.isArray(payload?.files)) return payload.files`,
    `  if (Array.isArray(payload?.urls)) return payload.urls`,
    `  if (Array.isArray(payload?.fileNames)) return payload.fileNames`,
    `  if (Array.isArray(payload?.filenames)) return payload.filenames`,
    `  if (Array.isArray(payload?.paths)) return payload.paths`,
    `  return payload ? [payload] : []`,
    `}`,
    ``,
    `const isAbsoluteUploadUrl = (value = '') => /^https?:\\/\\//i.test(String(value)) || String(value).startsWith('/api/')`,
    ``,
    `const resolveUploadFilename = (item) => {`,
    `  if (typeof item === 'string') return item`,
    `  return item?.filename`,
    `    ?? item?.file_name`,
    `    ?? item?.fileName`,
    `    ?? item?.file_name_path`,
    `    ?? item?.path`,
    `    ?? item?.fullPath`,
    `    ?? item?.full_path`,
    `    ?? item?.url`,
    `    ?? item?.fileUrl`,
    `    ?? item?.file_url`,
    `    ?? ''`,
    `}`,
    ``,
    `const resolveUploadUrl = (item) => {`,
    `  const filename = resolveUploadFilename(item)`,
    `  if (!filename) return ''`,
    `  if (isAbsoluteUploadUrl(filename)) return filename`,
    `  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\\/$/, '')`,
    `  return \`\${baseUrl}/upload/folder/view?filename=\${encodeURIComponent(filename)}\``,
    `}`,
    ``,
    `const toUploadFile = (item, index) => {`,
    `  if (item?.uid) return item`,
    `  const filename = resolveUploadFilename(item)`,
    `  const url = resolveUploadUrl(item)`,
    `  const name = item?.name ?? filename?.split('/').pop() ?? \`file-\${index + 1}\``,
    `  return { uid: item?.id ?? filename ?? url ?? \`upload-\${index}\`, name, status: 'done', url, thumbUrl: url, response: item }`,
    `}`,
    ``,
    `const fileListToValues = (event) => {`,
    `  const fileList = Array.isArray(event) ? event : (event?.fileList ?? [])`,
    `  return fileList`,
    `    .filter(file => file.status === 'done')`,
    `    .flatMap(file => extractUploadItems(file.response ?? resolveUploadUrl(file)))`,
    `}`,
    ``,
    `const FormFileUpload = ({ name, label, required, accept, folder = 'test', image = false, maxSizeMB }) => {`,
    `  const form = Form.useFormInstance()`,
    `  const formValue = Form.useWatch(name, form)`,
    `  const [fileList, setFileList] = React.useState([])`,
    ``,
    `  React.useEffect(() => {`,
    `    setFileList(current => {`,
    `      if (current.some(file => file.status === 'uploading')) return current`,
    `      return (Array.isArray(formValue) ? formValue : (formValue ? [formValue] : [])).map(toUploadFile)`,
    `    })`,
    `  }, [formValue])`,
    ``,
    `  return (`,
    `    <>`,
    `      <Form.Item label={label} required={required}>`,
    `        <Upload.Dragger`,
    `          multiple`,
    `          accept={accept || undefined}`,
    `          fileList={fileList}`,
    `          listType={image ? 'picture' : 'text'}`,
    `          beforeUpload={(file) => {`,
    `            if (maxSizeMB && file.size / 1024 / 1024 > maxSizeMB) {`,
    `              message.error(\`\${file.name} vượt quá \${maxSizeMB}MB\`)`,
    `              return Upload.LIST_IGNORE`,
    `            }`,
    `            return true`,
    `          }}`,
    `          onChange={({ fileList: nextFileList }) => {`,
    `            setFileList(nextFileList)`,
    `            form.setFieldValue(name, fileListToValues(nextFileList))`,
    `          }}`,
    `          onPreview={(file) => {`,
    `            const url = file.url ?? file.thumbUrl ?? resolveUploadUrl(file.response)`,
    `            if (url) {`,
    `              window.open(url, '_blank', 'noopener,noreferrer')`,
    `            }`,
    `          }}`,
    `          customRequest={async ({ file, onSuccess, onError }) => {`,
    `            try {`,
    `              const formData = new FormData()`,
    `              formData.append('files', file)`,
    `              formData.append('folder', folder)`,
    `              const response = await axios.post('/upload/folder/multiple', formData, {`,
    `                headers: { 'Content-Type': 'multipart/form-data' },`,
    `              })`,
    `              const uploaded = extractUploadItems(response.data)`,
    `              onSuccess(uploaded.length === 1 ? uploaded[0] : uploaded)`,
    `            } catch (error) {`,
    `              message.error('Upload thất bại')`,
    `              onError(error)`,
    `            }`,
    `          }}`,
    `        >`,
    `          <p className="ant-upload-text">{image ? 'Kéo ảnh vào đây hoặc bấm để chọn' : 'Kéo file vào đây hoặc bấm để chọn'}</p>`,
    `          <p className="ant-upload-hint">Hỗ trợ tải nhiều file cùng lúc</p>`,
    `        </Upload.Dragger>`,
    `      </Form.Item>`,
    `      <Form.Item`,
    `        name={name}`,
    `        hidden`,
    `        getValueProps={() => ({ value: '' })}`,
    `        rules={[{`,
    `          validator: (_, value) => {`,
    `            if (!required || (Array.isArray(value) && value.length > 0)) return Promise.resolve()`,
    `            return Promise.reject(new Error('Vui lòng tải file'))`,
    `          },`,
    `        }]}`,
    `      >`,
    `        <input type="hidden" />`,
    `      </Form.Item>`,
    `    </>`,
    `  )`,
    `}`,
  ].join('\n')
}

function getUploadFieldKeys(fields = []) {
  return fields.flatMap(field => [
    ...(field.inputType === 'file' || field.inputType === 'image' ? [field.fieldKey].filter(Boolean) : []),
    ...getUploadFieldKeys(field.children ?? []),
  ])
}

function buildBlockHelper(fields) {
  const hasBlock = fields.some(field => field.inputType === 'block')
  if (!hasBlock) return ''

  return [
    `const FormBlockPreview = ({ title, children }) => {`,
    `  return (`,
    `    <div style={{ border: '1px dashed #d9d9d9', background: '#fff', borderRadius: 6, padding: 16 }}>`,
    `      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title || 'Block'}</div>`,
    `      {children}`,
    `    </div>`,
    `  )`,
    `}`,
  ].join('\n')
}

/* ─── Main export ────────────────────────────────────────────────────────────── */

/**
 * @param {object} schema — { meta, fields[] }
 * @returns {{ plain: string, html: string }}
 */
export function buildJSX(schema) {
  
  const { meta = {}, fields = [] } = schema
  const componentName = toComponentName(meta.name)
  const plainLines = []
  const htmlLines  = []

  const add = (p, h_) => { plainLines.push(p); htmlLines.push(h_) }

  /* ── Imports ── */
  const importsPlain = buildImports(fields)
  const highlightNamedImport = (source, pkg) => source
    .replace(/import React from 'react'/g, `${h('punct', 'import')} ${h('tag', 'React')} ${h('punct', 'from')} ${h('string', "'react'")}`)
    .replace(
      new RegExp(`import \\{ (.*?) \\} from '${pkg.replace(/\//g, '\\/')}'`, 'g'),
      (_, names) => {
        const highlighted = names
          .split(',')
          .map(part => h('tag', part.trim()))
          .join(`${h('punct', ', ')}`)
        return `${h('punct', 'import')} ${h('punct', '{')} ${highlighted} ${h('punct', '}')} ${h('punct', 'from')} ${h('string', `'${pkg}'`)}`
      },
    )

  const importsHtml = highlightNamedImport(
    highlightNamedImport(
      importsPlain.replace(
        /import React, \{ (.*?) \} from 'react'/g,
        (_, names) => `${h('punct', 'import')} ${h('tag', 'React')}${h('punct', ', {')} ${names.split(',').map(part => h('tag', part.trim())).join(`${h('punct', ', ')}`)} ${h('punct', '} from')} ${h('string', "'react'")}`,
      ),
      '@flast-erp/core/components',
    ),
    'antd',
  )

  importsPlain.split('\n').forEach((line, i) => {
    add(line, importsHtml.split('\n')[i] ?? line)
  })
  add('', '')

  const blockHelper = buildBlockHelper(fields)
  if (blockHelper) {
    blockHelper.split('\n').forEach(line => add(line, line))
    add('', '')
  }

  const uploadHelper = buildUploadHelper(fields)
  if (uploadHelper) {
    uploadHelper.split('\n').forEach(line => add(line, line))
    add('', '')
  }

  const uploadFieldKeys = getUploadFieldKeys(fields)
  if (uploadFieldKeys.length > 0) {
    add(`const UPLOAD_FIELD_NAMES = ${JSON.stringify(uploadFieldKeys)}`, `const UPLOAD_FIELD_NAMES = ${JSON.stringify(uploadFieldKeys)}`)
    add('', '')
  }

  /* ── Component ── */
  add(`const ${componentName} = forwardRef(({`, `${h('punct', 'const')} ${h('tag', componentName)} ${h('punct', '= forwardRef(({')}`)
  add(`  initialValues,`, `  initialValues,`)
  add(`  onSubmit,`, `  onSubmit,`)
  add(`  onSubmitError,`, `  onSubmitError,`)
  add(`  submitSignal,`, `  submitSignal,`)
  add(`  order,`, `  order,`)
  add(`  record,`, `  record,`)
  add(`  data,`, `  data,`)
  add(`  step,`, `  step,`)
  add(`  formTemplate,`, `  formTemplate,`)
  add(`}, ref) => {`, `}, ref) => {`)
  add("  const [form] = Form.useForm()", `  ${h('punct', 'const')} ${h('punct', '[form]')} ${h('punct', '=')} ${h('tag', 'Form')}${h('punct', '.useForm()')}`)
  add(`  const previousSubmitSignalRef = useRef(submitSignal)`, `  const previousSubmitSignalRef = useRef(submitSignal)`)
  add(`  const contextData = data ?? record ?? order ?? {}`, `  const contextData = data ?? record ?? order ?? {}`)
  add('', '')
  add(`  const submit = useCallback(async () => {`, `  const submit = useCallback(async () => {`)
  add(`    let values`, `    let values`)
  add(`    try {`, `    try {`)
  add(`      values = await form.validateFields()`, `      values = await form.validateFields()`)
  add(`    } catch (error) {`, `    } catch (error) {`)
  add(`      error.remoteFormHandled = true`, `      error.remoteFormHandled = true`)
  add(`      onSubmitError?.(error)`, `      onSubmitError?.(error)`)
  add(`      throw error`, `      throw error`)
  add(`    }`, `    }`)
  add('', '')
  if (uploadFieldKeys.length > 0) {
    add(`    const files = UPLOAD_FIELD_NAMES.flatMap((fieldName) => {`, `    const files = UPLOAD_FIELD_NAMES.flatMap((fieldName) => {`)
    add(`      const value = values[fieldName]`, `      const value = values[fieldName]`)
    add(`      return Array.isArray(value) ? value : (value ? [value] : [])`, `      return Array.isArray(value) ? value : (value ? [value] : [])`)
    add(`    })`, `    })`)
    add(`    const submitValues = files.length > 0 ? { ...values, files } : values`, `    const submitValues = files.length > 0 ? { ...values, files } : values`)
  } else {
    add(`    const submitValues = values`, `    const submitValues = values`)
  }
  add('', '')
  add(`    await onSubmit?.(submitValues, {`, `    await onSubmit?.(submitValues, {`)
  add(`      order: contextData,`, `      order: contextData,`)
  add(`      record: contextData,`, `      record: contextData,`)
  add(`      data: contextData,`, `      data: contextData,`)
  add(`      step,`, `      step,`)
  add(`      formTemplate,`, `      formTemplate,`)
  add(`    })`, `    })`)
  add(`    return submitValues`, `    return submitValues`)
  add(`  }, [contextData, form, formTemplate, onSubmit, onSubmitError, step])`, `  }, [contextData, form, formTemplate, onSubmit, onSubmitError, step])`)
  add('', '')
  add(`  useImperativeHandle(ref, () => ({`, `  useImperativeHandle(ref, () => ({`)
  add(`    submit,`, `    submit,`)
  add(`    getValues: () => form.getFieldsValue(true),`, `    getValues: () => form.getFieldsValue(true),`)
  add(`    reset: () => form.resetFields(),`, `    reset: () => form.resetFields(),`)
  add(`  }), [form, submit])`, `  }), [form, submit])`)
  add('', '')
  add(`  useEffect(() => {`, `  useEffect(() => {`)
  add(`    if (initialValues && typeof initialValues === 'object') {`, `    if (initialValues && typeof initialValues === 'object') {`)
  add(`      form.setFieldsValue(initialValues)`, `      form.setFieldsValue(initialValues)`)
  add(`    }`, `    }`)
  add(`  }, [form, initialValues])`, `  }, [form, initialValues])`)
  add('', '')
  add(`  useEffect(() => {`, `  useEffect(() => {`)
  add(`    if (submitSignal === undefined || submitSignal === null) {`, `    if (submitSignal === undefined || submitSignal === null) {`)
  add(`      previousSubmitSignalRef.current = submitSignal`, `      previousSubmitSignalRef.current = submitSignal`)
  add(`      return`, `      return`)
  add(`    }`, `    }`)
  add(`    if (previousSubmitSignalRef.current === submitSignal) {`, `    if (previousSubmitSignalRef.current === submitSignal) {`)
  add(`      return`, `      return`)
  add(`    }`, `    }`)
  add(`    previousSubmitSignalRef.current = submitSignal`, `    previousSubmitSignalRef.current = submitSignal`)
  add(`    submit().catch(() => undefined)`, `    submit().catch(() => undefined)`)
  add(`  }, [submit, submitSignal])`, `  }, [submit, submitSignal])`)
  add('', '')
  add('  return (', `  ${h('punct', 'return (')}`)
  add(`    <Form form={form} layout="vertical">`,
    `    ${h('tag', '<Form')} ${h('attr', 'form')}${h('punct', '={form}')} ${h('attr', 'layout')}${h('punct', '=')}${h('string', '"vertical"')}${h('tag', '>')}`)
  add('      <Row gutter={[16, 0]}>', `      ${h('tag', '<Row')} ${h('attr', 'gutter')}${h('punct', '={[16, 0]}')}${h('tag', '>')}`)

  /* ── Fields ── */
  for (const field of fields) {
    const span = field.colSpan ?? 24
    add(`        <Col span={${span}}>`, `        ${h('tag', '<Col')} ${h('attr', 'span')}${h('punct', `={${span}}`)}${h('tag', '>')}`)

    const { plain: fp, html: fh } = fieldToJSXLines(field, '          ')
    fp.forEach((l, i) => add(l, fh[i]))

    add('        </Col>', `        ${h('tag', '</Col>')}`)
  }

  add('      </Row>', `      ${h('tag', '</Row>')}`)
  add(`    </Form>`, `    ${h('tag', '</Form>')}`)
  add('  )', `  ${h('punct', ')')}`)
  add('})', `${h('punct', '})')}`)
  add('', '')
  add(`${componentName}.displayName = '${componentName}'`, `${h('tag', componentName)}${h('punct', '.displayName = ')}${h('string', `'${componentName}'`)}`)
  add('', '')
  add(`export default ${componentName}`, `${h('punct', 'export default')} ${h('tag', componentName)}`)

  return {
    plain: plainLines.join('\n'),
    html : htmlLines.join('\n'),
  }
};
