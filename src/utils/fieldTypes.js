/**
 * fieldTypes.js
 *
 * Map 14 InputType enum (FormTemplateField.java) sang config FE.
 * Mỗi entry định nghĩa:
 *   - type        : khớp với BE enum (FormTemplateField.InputType)
 *   - label       : tên hiển thị trong sidebar
 *   - icon        : tên icon antd (string) — import tập trung ở component dùng
 *   - component   : tên component trong form.rar — import theo alias:
 *                   '@/form-flast/FormInput', '@/form-flast/FormSelect', v.v.
 *   - defaultConfig: giá trị mặc định cho config JSON gửi lên BE
 *   - configSchema : các field cần hiện trong FieldConfigPanel (panel phải)
 */

/**
 * configSchema field shape:
 * {
 *   key      : string           — key trong config object
 *   label    : string           — label hiển thị
 *   widget   : 'number'         — FormInputNumber
 *              | 'input'        — FormInput
 *              | 'select'       — FormSelect (options cố định)
 *              | 'options_editor' — editor thêm/xóa options [{value,label}]
 *              | 'accept_input' — input text cho MIME types
 *   props    : object           — props thêm cho widget (optional)
 *   options  : array            — chỉ dùng khi widget='select'
 * }
 */

export const FIELD_TYPES = [
  // ─── Block ───────────────────────────────────────────────────────────────
  {
    type        : 'block',
    label       : 'Block',
    icon        : 'AppstoreOutlined',
    component   : null,
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Text ────────────────────────────────────────────────────────────────
  {
    type        : 'text',
    label       : 'Text',
    icon        : 'EditOutlined',
    component   : 'FormInput',
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Textarea ────────────────────────────────────────────────────────────
  {
    type        : 'textarea',
    label       : 'Textarea',
    icon        : 'MenuOutlined',
    component   : 'FormTextArea',
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Number ──────────────────────────────────────────────────────────────
  {
    type        : 'number',
    label       : 'Number',
    icon        : 'NumberOutlined',
    component   : 'FormInputNumber',
    defaultConfig: { min: 0, max: null },
    configSchema : [
      { key: 'min', label: 'Min', widget: 'number', props: { precision: 0 } },
      { key: 'max', label: 'Max', widget: 'number', props: { precision: 0 } },
    ],
  },

  // ─── Decimal ─────────────────────────────────────────────────────────────
  {
    type        : 'decimal',
    label       : 'Decimal',
    icon        : 'CalculatorOutlined',
    component   : 'FormInputNumber',
    componentProps: { precision: 2 },
    defaultConfig: { min: null, max: null },
    configSchema : [
      { key: 'min', label: 'Min', widget: 'number', props: { precision: 2 } },
      { key: 'max', label: 'Max', widget: 'number', props: { precision: 2 } },
    ],
  },

  // ─── Date ────────────────────────────────────────────────────────────────
  {
    type        : 'date',
    label       : 'Date',
    icon        : 'CalendarOutlined',
    component   : 'FormDatePicker',
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Datetime ────────────────────────────────────────────────────────────
  {
    type        : 'datetime',
    label       : 'Datetime',
    icon        : 'ClockCircleOutlined',
    component   : 'FormDatePicker',
    componentProps: { showTime: true },
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Select ──────────────────────────────────────────────────────────────
  {
    type        : 'select',
    label       : 'Select',
    icon        : 'CaretDownOutlined',
    component   : 'FormSelect',
    defaultConfig: { options: [] },
    configSchema : [
      { key: 'options', label: 'Tùy chọn', widget: 'options_editor' },
    ],
  },

  // ─── Select API ───────────────────────────────────────────────────────────
  {
    type        : 'select_api',
    label       : 'FormSelectAPI',
    icon        : 'SearchOutlined',
    component   : 'FormSelectAPI',
    defaultConfig: {
      api       : '',
      entity    : '',
      labelField: 'name',
      valueProp : 'id',
      titleProp : 'name',
      dataLabel : '',
      dataValue : '',
    },
    configSchema : [
      { key: 'api',        label: 'API path', widget: 'input',
        props: { placeholder: '/customer/list' } },
      { key: 'entity',     label: 'Entity', widget: 'input',
        props: { placeholder: 'customer, order...' } },
      { key: 'labelField', label: 'Hiển thị field', widget: 'input',
        props: { placeholder: 'name' } },
      { key: 'valueProp',  label: 'Value prop', widget: 'input',
        props: { placeholder: 'id' } },
      { key: 'titleProp',  label: 'Title prop', widget: 'input',
        props: { placeholder: 'name' } },
      { key: 'dataLabel',  label: 'Dữ liệu hiển thị', widget: 'input',
        props: { placeholder: 'data?.valuesJson?.ten_menu' } },
      { key: 'dataValue',  label: 'Dữ liệu gửi đi', widget: 'input',
        props: { placeholder: 'data?.valuesJson?.so_thu_tu' } },
    ],
  },

  // ─── Auto complete ────────────────────────────────────────────────────────
  {
    type        : 'autocomplete',
    label       : 'FormAutoComplete',
    icon        : 'EditOutlined',
    component   : 'FormAutoComplete',
    defaultConfig: {
      options  : [],
      valueProp: 'value',
      titleProp: 'label',
    },
    configSchema : [
      { key: 'options',   label: 'Gợi ý', widget: 'options_editor' },
      { key: 'valueProp', label: 'Value prop', widget: 'input',
        props: { placeholder: 'value' } },
      { key: 'titleProp', label: 'Title prop', widget: 'input',
        props: { placeholder: 'label' } },
    ],
  },

  // ─── Multi-select ────────────────────────────────────────────────────────
  {
    type        : 'multi_select',
    label       : 'Multi-select',
    icon        : 'UnorderedListOutlined',
    component   : 'FormSelect',
    componentProps: { mode: 'multiple' },
    defaultConfig: { options: [] },
    configSchema : [
      { key: 'options', label: 'Tùy chọn', widget: 'options_editor' },
    ],
  },

  // ─── Radio ───────────────────────────────────────────────────────────────
  {
    type        : 'radio',
    label       : 'Radio',
    icon        : 'CheckCircleOutlined',
    component   : 'FormRadioGroup',
    defaultConfig: { options: [] },
    configSchema : [
      { key: 'options', label: 'Tùy chọn', widget: 'options_editor' },
    ],
  },

  // ─── Checkbox ────────────────────────────────────────────────────────────
  {
    type        : 'checkbox',
    label       : 'Checkbox',
    icon        : 'CheckSquareOutlined',
    component   : 'FormCheckbox',
    defaultConfig: { options: [] },
    configSchema : [
      { key: 'options', label: 'Tùy chọn', widget: 'options_editor' },
    ],
  },

  // ─── File ────────────────────────────────────────────────────────────────
  {
    type        : 'file',
    label       : 'File',
    icon        : 'UploadOutlined',
    component   : null,    // custom Upload component
    defaultConfig: { maxSize: 5, accept: '' },
    configSchema : [
      { key: 'accept',  label: 'Loại file cho phép', widget: 'accept_input',
        props: { placeholder: 'application/pdf,.docx' } },
      { key: 'maxSize', label: 'Dung lượng tối đa (MB)', widget: 'number',
        props: { min: 1, max: 100, precision: 0 } },
    ],
  },

  // ─── Image ───────────────────────────────────────────────────────────────
  {
    type        : 'image',
    label       : 'Image',
    icon        : 'PictureOutlined',
    component   : null,    // custom Upload component
    defaultConfig: { maxSize: 5, accept: 'image/jpeg,image/png' },
    configSchema : [
      { key: 'accept',  label: 'Loại ảnh cho phép', widget: 'accept_input',
        props: { placeholder: 'image/jpeg,image/png' } },
      { key: 'maxSize', label: 'Dung lượng tối đa (MB)', widget: 'number',
        props: { min: 1, max: 50, precision: 0 } },
    ],
  },

  // ─── Richtext ────────────────────────────────────────────────────────────
  {
    type        : 'richtext',
    label       : 'Richtext',
    icon        : 'FontSizeOutlined',
    component   : 'FormJoditEditor',
    defaultConfig: {},
    configSchema : [],
  },

  // ─── Lookup ──────────────────────────────────────────────────────────────
  {
    type        : 'lookup',
    label       : 'Lookup',
    icon        : 'SearchOutlined',
    component   : 'FormSelectAPI',
    defaultConfig: { entity: '', labelField: 'name' },
    configSchema : [
      { key: 'entity',     label: 'Entity', widget: 'input',
        props: { placeholder: 'customer, order...' } },
      { key: 'labelField', label: 'Hiển thị field', widget: 'input',
        props: { placeholder: 'name' } },
    ],
  },
];

/**
 * Map type string → entry trong FIELD_TYPES.
 * Dùng: getFieldType('number') → { type, label, icon, ... }
 */
export const FIELD_TYPE_MAP = Object.fromEntries(
  FIELD_TYPES.map(ft => [ft.type, ft])
);

/**
 * Trả về defaultConfig cho một type.
 * Dùng khi khởi tạo field mới sau khi user kéo thả vào canvas.
 */
export function getDefaultConfig(type) {
  return structuredClone(FIELD_TYPE_MAP[type]?.defaultConfig ?? {});
}

/**
 * Trả về configSchema cho một type.
 * FieldConfigPanel dùng để render các field cấu hình ràng buộc.
 */
export function getConfigSchema(type) {
  return FIELD_TYPE_MAP[type]?.configSchema ?? [];
}

/**
 * Các type có options editor (select/multi_select/radio/checkbox).
 */
export const TYPES_WITH_OPTIONS = ['select', 'multi_select', 'radio', 'checkbox'];

/**
 * Các type có ràng buộc min/max.
 */
export const TYPES_WITH_MINMAX = ['number', 'decimal'];
