import { nanoid } from 'nanoid'

const COMPONENT_TO_INPUT = {
  FormBlockPreview: 'block',
  FormInput: 'text',
  FormTextArea: 'textarea',
  FormInputNumber: 'number',
  FormDatePicker: 'date',
  FormSelect: 'select',
  FormRadioGroup: 'radio',
  FormCheckbox: 'checkbox',
  FormJoditEditor: 'richtext',
  FormSelectAPI: 'select_api',
  FormAutoComplete: 'autocomplete',
}

const readBalanced = (input, startIndex, openChar, closeChar) => {
  let depth = 0
  let inString = false
  let stringQuote = ''
  let escaped = false

  for (let i = startIndex; i < input.length; i += 1) {
    const char = input[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === stringQuote) {
        inString = false
        stringQuote = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      stringQuote = char
      continue
    }

    if (char === openChar) depth += 1
    if (char === closeChar) {
      depth -= 1
      if (depth === 0) {
        return { value: input.slice(startIndex + 1, i), endIndex: i }
      }
    }
  }

  throw new Error(`Cannot find matching ${closeChar}`)
}

const parseProps = (propsSource = '') => {
  const props = {}
  let index = 0

  while (index < propsSource.length) {
    while (/\s/.test(propsSource[index] || '')) index += 1
    if (index >= propsSource.length) break

    const keyMatch = propsSource.slice(index).match(/^([A-Za-z_][A-Za-z0-9_]*)/)
    if (!keyMatch) {
      index += 1
      continue
    }

    const key = keyMatch[1]
    index += key.length

    while (/\s/.test(propsSource[index] || '')) index += 1

    if (propsSource[index] !== '=') {
      props[key] = true
      continue
    }

    index += 1
    while (/\s/.test(propsSource[index] || '')) index += 1

    const char = propsSource[index]

    if (char === '"' || char === "'") {
      const endIndex = propsSource.indexOf(char, index + 1)
      props[key] = propsSource.slice(index + 1, endIndex)
      index = endIndex + 1
      continue
    }

    if (char === '{') {
      const { value, endIndex } = readBalanced(propsSource, index, '{', '}')
      props[key] = { type: 'expr', value: value.trim() }
      index = endIndex + 1
      continue
    }
  }

  return props
}

const propToString = (prop, fallback = '') => {
  if (typeof prop === 'string') return prop
  if (prop?.type === 'expr') {
    const translationMatch = prop.value.match(/^t\(['"]([^'"]+)['"]\)$/)
    return translationMatch?.[1] ?? prop.value
  }
  return fallback
}

const mapComponentToField = (componentName, props, span) => {
  let inputType = COMPONENT_TO_INPUT[componentName] ?? 'text'
  const config = {}

  if (componentName === 'FormInputNumber') {
    const precision = Number(props.precision?.value ?? 0)
    inputType = precision === 2 ? 'decimal' : 'number'
    if (props.min?.value != null) config.min = Number(props.min.value)
    if (props.max?.value != null) config.max = Number(props.max.value)
  }

  if (componentName === 'FormDatePicker') {
    inputType = props.showTime ? 'datetime' : 'date'
  }

  if (componentName === 'FormSelect') {
    inputType = propToString(props.mode) === 'multiple' ? 'multi_select' : 'select'
    if (props.resourceData?.value) {
      try {
        const items = JSON.parse(props.resourceData.value)
        config.options = items.map(item => ({
          value: item.id ?? item.value,
          label: item.name ?? item.label ?? item.value,
        }))
      } catch (_) {}
    }
  }

  if (componentName === 'FormRadioGroup' || componentName === 'FormCheckbox') {
    if (props.options?.value) {
      try {
        config.options = JSON.parse(props.options.value)
      } catch (_) {}
    }
  }

  if (componentName === 'FormSelectAPI') {
    inputType = 'select_api'
    config.api = propToString(props.api)
    config.entity = propToString(props.entity)
    config.labelField = propToString(props.labelField, 'name')
    config.valueProp = propToString(props.valueProp, 'id')
    config.titleProp = propToString(props.titleProp, config.labelField || 'name')
  }

  if (componentName === 'FormAutoComplete') {
    inputType = 'autocomplete'
    config.valueProp = propToString(props.valueProp, 'value')
    config.titleProp = propToString(props.titleProp, 'label')
    if (props.resourceData?.value) {
      try {
        const items = JSON.parse(props.resourceData.value)
        config.options = items.map(item => ({
          value: item.id ?? item.value,
          label: item.name ?? item.label ?? item.value,
        }))
      } catch (_) {}
    }
  }

  if (props.placeholder) {
    config.placeholder = propToString(props.placeholder)
  }

  if (componentName === 'FormBlockPreview') {
    inputType = 'block'
  }

  if (componentName === 'FormInput') {
    const placeholder = props.placeholder ?? ''
    if (/kéo ảnh/i.test(placeholder)) inputType = 'image'
    else if (/kéo file/i.test(placeholder)) inputType = 'file'
  }

  return {
    _id: nanoid(),
    id: null,
    fieldKey: propToString(props.name),
    label: propToString(props.label ?? props.title),
    inputType,
    isRequired: Boolean(props.required),
    isSearchable: false,
    isIndexed: false,
    sortOrder: 0,
    enabled: true,
    config,
    colSpan: span,
    refDomain: null,
    autoGenerate: null,
    fieldRole: null,
    children: inputType === 'block' ? [] : undefined,
  }
}

const extractTopLevelCols = (content = '') => {
  const cols = []
  let index = 0

  while (index < content.length) {
    const openIndex = content.indexOf('<Col', index)
    if (openIndex === -1) break

    const tagEndIndex = content.indexOf('>', openIndex)
    if (tagEndIndex === -1) break

    const openTag = content.slice(openIndex, tagEndIndex + 1)
    const spanMatch =
      openTag.match(/span=\{(\d+)\}/) ??
      openTag.match(/md=\{(\d+)\}/) ??
      openTag.match(/lg=\{(\d+)\}/) ??
      openTag.match(/sm=\{(\d+)\}/) ??
      openTag.match(/xs=\{(\d+)\}/)
    const span = Number(spanMatch?.[1] ?? 24)

    let depth = 1
    let cursor = tagEndIndex + 1

    while (cursor < content.length && depth > 0) {
      const nextOpen = content.indexOf('<Col', cursor)
      const nextClose = content.indexOf('</Col>', cursor)

      if (nextClose === -1) {
        throw new Error('Khong tim thay the dong </Col> tuong ung.')
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        cursor = content.indexOf('>', nextOpen)
        if (cursor === -1) {
          throw new Error('The <Col> khong hop le.')
        }
        cursor += 1
        continue
      }

      depth -= 1
      if (depth === 0) {
        cols.push({
          span,
          content: content.slice(tagEndIndex + 1, nextClose),
        })
        index = nextClose + '</Col>'.length
        break
      }
      cursor = nextClose + '</Col>'.length
    }
  }

  return cols
}

const extractComponentNode = (block = '') => {
  const trimmed = block.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').trim()
  if (!trimmed.startsWith('<')) return null

  const openTagMatch = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\s*([\s\S]*?)(\/?)>/)
  if (!openTagMatch) return null

  const componentName = openTagMatch[1]
  const propsSource = openTagMatch[2] ?? ''
  const isSelfClosing = openTagMatch[3] === '/'

  if (isSelfClosing) {
    return {
      componentName,
      propsSource,
      childrenSource: '',
      isSelfClosing: true,
    }
  }

  const openTag = openTagMatch[0]
  const closeTag = `</${componentName}>`
  const startIndex = openTag.length
  const endIndex = trimmed.lastIndexOf(closeTag)

  if (endIndex === -1) {
    throw new Error(`Khong tim thay the dong ${closeTag}.`)
  }

  return {
    componentName,
    propsSource,
    childrenSource: trimmed.slice(startIndex, endIndex),
    isSelfClosing: false,
  }
}

const parseFieldNodes = (content = '') => {
  const fields = []
  const cols = extractTopLevelCols(content)

  const fieldBlocks = cols.length > 0
    ? cols.map(col => ({ span: col.span, content: col.content }))
    : extractDirectFieldBlocks(content).map(block => ({ span: 24, content: block }))

  for (const fieldBlock of fieldBlocks) {
    const node = extractComponentNode(fieldBlock.content)
    if (!node) continue

    const props = parseProps(node.propsSource)
    const field = mapComponentToField(node.componentName, props, fieldBlock.span)

    if (node.componentName === 'FormBlockPreview') {
      field.children = parseFieldNodes(node.childrenSource)
    }

    fields.push(field)
  }

  return fields
}

const extractDirectFieldBlocks = (content = '') => {
  const blocks = []
  const componentNames = Object.keys(COMPONENT_TO_INPUT).join('|')
  const tagPattern = new RegExp(`<(${componentNames})\\b`, 'g')
  let match

  while ((match = tagPattern.exec(content))) {
    const startIndex = match.index
    const tagEndIndex = content.indexOf('>', startIndex)
    if (tagEndIndex === -1) break

    const openTag = content.slice(startIndex, tagEndIndex + 1)

    if (/\/>\s*$/.test(openTag)) {
      blocks.push(openTag)
      tagPattern.lastIndex = tagEndIndex + 1
      continue
    }

    const componentName = match[1]
    const closeTag = `</${componentName}>`
    const closeIndex = content.indexOf(closeTag, tagEndIndex + 1)

    if (closeIndex === -1) {
      tagPattern.lastIndex = tagEndIndex + 1
      continue
    }

    blocks.push(content.slice(startIndex, closeIndex + closeTag.length))
    tagPattern.lastIndex = closeIndex + closeTag.length
  }

  return blocks
}

export const parseJsxToSchema = (jsxCode, meta = {}) => {
  const fields = parseFieldNodes(jsxCode)

  if (fields.length === 0) {
    throw new Error('Khong parse duoc field nao tu JSX.')
  }

  return {
    meta,
    fields: fields.map((field, index) => ({ ...field, sortOrder: index })),
  }
}

export default parseJsxToSchema
