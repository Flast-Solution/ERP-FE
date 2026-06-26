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
  file        : 'FormInput',
  image       : 'FormInput',
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
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'multi_select':
      props.push({ key: 'mode', value: 'multiple', kind: 'str' })
      if (config.options?.length) {
        props.push({ key: 'resourceData', value: config.options, kind: 'json' })
      }
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'radio':
    case 'checkbox':
      if (config.options?.length) {
        props.push({ key: 'options', value: config.options, kind: 'json' })
      }
      break

    case 'lookup':
      if (config.entity)     props.push({ key: 'entity',     value: config.entity,               kind: 'str' })
      if (config.labelField) props.push({ key: 'labelField', value: config.labelField ?? 'name', kind: 'str' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'select_api':
      if (config.api)        props.push({ key: 'api',        value: config.api,                               kind: 'str' })
      if (config.entity)     props.push({ key: 'entity',     value: config.entity,                            kind: 'str' })
      if (config.labelField) props.push({ key: 'labelField', value: config.labelField ?? 'name',              kind: 'str' })
      props.push({ key: 'valueProp', value: config.valueProp ?? 'id', kind: 'str' })
      props.push({ key: 'titleProp', value: config.titleProp ?? config.labelField ?? 'name', kind: 'str' })
      props.push({ key: 'style', value: '{{ width: \'100%\' }}', kind: 'raw' })
      break

    case 'autocomplete':
      if (config.options?.length) {
        props.push({ key: 'resourceData', value: config.options, kind: 'json' })
      }
      props.push({ key: 'valueProp', value: config.valueProp ?? 'value', kind: 'str' })
      props.push({ key: 'titleProp', value: config.titleProp ?? 'label', kind: 'str' })
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
  const collect = (items = []) => {
    for (const item of items) {
      if (COMPONENT_MAP[item.inputType]) {
        used.add(COMPONENT_MAP[item.inputType])
      }
      collect(item.children ?? [])
    }
  }
  collect(fields)
  used.delete('FormBlockPreview')

  const lines = [`import React from 'react'`]
  const coreComponents = [...used].sort()
  if (coreComponents.length > 0) {
    lines.push(`import { ${coreComponents.join(', ')} } from '@flast-erp/core/components'`)
  }
  lines.push(`import { Form, Row, Col } from 'antd'`)

  return lines.join('\n')
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
    highlightNamedImport(importsPlain, '@flast-erp/core/components'),
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

  /* ── Component ── */
  add(`const ${componentName} = () => {`, `${h('punct', 'const')} ${h('tag', componentName)} ${h('punct', '= () => {')}`)
  add("  const [form] = Form.useForm()", `  ${h('punct', 'const')} ${h('punct', '[form]')} ${h('punct', '=')} ${h('tag', 'Form')}${h('punct', '.useForm()')}`)
  add('  return (', `  ${h('punct', 'return (')}`)
  add(`    <Form form={form} layout="vertical" onFinish={values => console.log(values)}>`,
    `    ${h('tag', '<Form')} ${h('attr', 'form')}${h('punct', '={form}')} ${h('attr', 'layout')}${h('punct', '=')}${h('string', '"vertical"')} ${h('attr', 'onFinish')}${h('punct', '={values => console.log(values)}')}${h('tag', '>')}`)
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
  add('}', `${h('punct', '}')}`)
  add('', '')
  add(`export default ${componentName}`, `${h('punct', 'export default')} ${h('tag', componentName)}`)

  return {
    plain: plainLines.join('\n'),
    html : htmlLines.join('\n'),
  }
};
