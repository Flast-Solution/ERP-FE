/**
 * useFormBuilderStore.js
 *
 * Zustand store cho Form Builder.
 *
 * State:
 *   templateMeta   — thông tin FormTemplate (id, name, domain, description, enabled)
 *   fields         — mảng FormTemplateField đang build, theo thứ tự canvas
 *   selectedId     — id field đang được chọn trong canvas (highlight + hiện panel phải)
 *   dirtyFieldKeys — Set<string> các field_key đã tồn tại trong DB (id != null)
 *                    → dùng để warn khi user sửa field_key
 *
 * Mỗi field trong `fields` có shape:
 * {
 *   _id        : string      — UUID nội bộ FE (không phải BE id)
 *   id         : number|null — BE id, null nếu field mới chưa save
 *   fieldKey   : string
 *   label      : string
 *   inputType  : string      — khớp FormTemplateField.InputType enum
 *   isRequired : boolean
 *   isSearchable: boolean
 *   isIndexed  : boolean
 *   sortOrder  : number      — tính lại khi save, không cần giữ sync realtime
 *   enabled    : boolean
 *   config     : object      — dynamic theo inputType
 *   // Advanced
 *   refDomain  : string|null
 *   autoGenerate: string|null
 *   fieldRole  : string|null
 * }
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { getDefaultConfig } from '@/utils/fieldTypes';
import { slugifyFieldKey } from '@/utils/slugify';

// ─── Factory: tạo field mới từ type ─────────────────────────────────────────

function createField(type) {
  return {
    _id         : nanoid(),
    id          : null,           // chưa save → null
    fieldKey    : '',
    label       : '',
    inputType   : type,
    isRequired  : false,
    isSearchable: false,
    isIndexed   : false,
    sortOrder   : 0,              // tính lại khi save
    enabled     : true,
    config      : getDefaultConfig(type),
    colSpan     : 24,
    refDomain   : null,
    autoGenerate: null,
    fieldRole   : null,
  };
}


const useFormBuilderStore = create(
  immer((set, get) => ({

    templateMeta: {
      id         : null,
      name       : '',
      domain     : '',
      description: '',
      enabled    : true,
    },

    fields    : [],       // FormTemplateField[]
    selectedId: null,     // _id của field đang chọn

    /**
     * Set<fieldKey> của các field đã có trong DB (id != null).
     * Warn user khi sửa field_key của field đã save.
     */
    savedFieldKeys: new Set(),

    setTemplateMeta(patch) {
      set(state => {
        Object.assign(state.templateMeta, patch);
      });
    },

    /**
     * Khởi tạo store từ data trả về BE (GET /form-templates/:id).
     * @param {object} template — FormTemplate entity (có fields[])
     */
    loadFromApi(template) {
      set(state => {
        state.templateMeta = {
          id         : template.id,
          name       : template.name,
          domain     : template.domain,
          description: template.description ?? '',
          enabled    : template.enabled ?? true,
        };

        state.fields = (template.fields ?? [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(f => ({
            _id         : nanoid(),       // _id nội bộ FE
            id          : f.id,
            fieldKey    : f.fieldKey,
            label       : f.label,
            inputType   : f.inputType,
            isRequired  : f.isRequired  ?? false,
            isSearchable: f.isSearchable ?? false,
            isIndexed   : f.isIndexed   ?? false,
            sortOrder   : f.sortOrder   ?? 0,
            enabled     : f.enabled     ?? true,
            config      : f.config      ?? {},
            refDomain   : f.refDomain   ?? null,
            autoGenerate: f.autoGenerate ?? null,
            colSpan     : f.colSpan     ?? 24,
            fieldRole   : f.fieldRole   ?? null,
          }));

        state.savedFieldKeys = new Set(
          state.fields.filter(f => f.id != null).map(f => f.fieldKey)
        );

        state.selectedId = null;
      });
    },


    /**
     * Thêm field mới vào cuối canvas (hoặc tại index chỉ định).
     * Gọi khi user thả từ sidebar.
     * @param {string} type      — InputType enum string
     * @param {number} [atIndex] — nếu có, chèn vào vị trí này
     * @returns {string} _id của field vừa tạo
     */
    addField(type, atIndex) {
      const field = createField(type);
      set(state => {
        if (atIndex != null) {
          state.fields.splice(atIndex, 0, field);
        } else {
          state.fields.push(field);
        }
        state.selectedId = field._id;
      });
      return field._id;
    },

    /**
     * Xóa field khỏi canvas.
     * @param {string} _id
     */
    removeField(_id) {
      set(state => {
        state.fields = state.fields.filter(f => f._id !== _id);
        if (state.selectedId === _id) {
          state.selectedId = null;
        }
      });
    },

    /**
     * Cập nhật một hoặc nhiều thuộc tính của field.
     * @param {string} _id
     * @param {object} patch — partial field
     */
    updateField(_id, patch) {
      set(state => {
        const idx = state.fields.findIndex(f => f._id === _id);
        if (idx === -1) return;
        Object.assign(state.fields[idx], patch);
      });
    },

    /**
     * Cập nhật label và tự slugify → fieldKey nếu field chưa save
     * hoặc fieldKey hiện tại = slug của label cũ (chưa bị user sửa tay).
     * @param {string} _id
     * @param {string} newLabel
     */
    updateLabel(_id, newLabel) {
      set(state => {
        const field = state.fields.find(f => f._id === _id);
        if (!field) return;

        const prevSlug = slugifyFieldKey(field.label);
        const shouldAutoSlug =
          field.id == null &&                      // chưa save
          (field.fieldKey === '' || field.fieldKey === prevSlug);

        field.label = newLabel;
        if (shouldAutoSlug) {
          field.fieldKey = slugifyFieldKey(newLabel);
        }
      });
    },

    /**
     * Cập nhật config của field (merge, không replace).
     * @param {string} _id
     * @param {object} configPatch
     */
    updateConfig(_id, configPatch) {
      set(state => {
        const field = state.fields.find(f => f._id === _id);
        if (!field) return;
        field.config = { ...field.config, ...configPatch };
      });
    },

    /**
     * Đổi thứ tự field sau khi kéo thả (dnd-kit arrayMove).
     * @param {string[]} newOrder — mảng _id theo thứ tự mới
     */
    reorderFields(newOrder) {
      set(state => {
        const map = Object.fromEntries(state.fields.map(f => [f._id, f]));
        state.fields = newOrder.map(id => map[id]).filter(Boolean);
      });
    },

    selectField(_id) {
      set(state => { state.selectedId = _id; });
    },

    clearSelection() {
      set(state => { state.selectedId = null; });
    },

    /** Field đang được chọn, hoặc null */
    getSelectedField() {
      const { fields, selectedId } = get();
      return fields.find(f => f._id === selectedId) ?? null;
    },

    /**
     * Kiểm tra field_key có bị trùng trong canvas không.
     * Dùng trong FieldConfigPanel để show warning.
     * @param {string} fieldKey
     * @param {string} selfId — _id của field đang check (bỏ qua chính nó)
     */
    isDuplicateFieldKey(fieldKey, selfId) {
      const { fields } = get();
      return fields.some(f => f._id !== selfId && f.fieldKey === fieldKey);
    },


    /**
     * Trả về payload POST/PUT cho BE.
     * sortOrder tính lại theo vị trí hiện tại trong mảng.
     *
     * @returns {{ meta: object, fields: object[] }}
     */
    toPayload() {
      const { templateMeta, fields } = get();
      return {
        meta: { ...templateMeta },
        fields: fields.map((f, index) => ({
          id          : f.id,
          fieldKey    : f.fieldKey,
          label       : f.label,
          inputType   : f.inputType,
          isRequired  : f.isRequired,
          isSearchable: f.isSearchable,
          isIndexed   : f.isIndexed,
          sortOrder   : index,
          enabled     : f.enabled,
          config      : f.config,
          refDomain   : f.refDomain,
          autoGenerate: f.autoGenerate,
          colSpan     : f.colSpan,
          fieldRole   : f.fieldRole,
        })),
      };
    },

    reset() {
      set(state => {
        state.templateMeta  = { id: null, name: '', domain: '', description: '', enabled: true };
        state.fields        = [];
        state.selectedId    = null;
        state.savedFieldKeys = new Set();
      });
    },
  }))
);

export default useFormBuilderStore;