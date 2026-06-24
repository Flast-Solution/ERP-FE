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

function createProvenance(source = 'user', action = 'created', existing = null) {
  const now = new Date().toISOString();
  const previous = existing?._provenance ?? existing?.config?.__provenance ?? existing?.provenance ?? null;

  if (previous && source === 'api' && action === 'loaded') {
    return previous;
  }

  const createdBySource = previous?.createdBySource ?? previous?.source ?? source;
  const createdAction = previous?.createdAction ?? previous?.sourceAction ?? action;
  const createdAt = previous?.createdAt ?? now;

  return {
    source: createdBySource,
    sourceAction: createdAction,
    createdBySource,
    createdAction,
    createdAt,
    updatedBySource: source,
    updatedAction: action,
    updatedAt: now,
  };
}

function touchProvenance(field, source = 'user', action = 'edited') {
  field._provenance = createProvenance(source, action, field);
  field.config = {
    ...(field.config ?? {}),
    __provenance: field._provenance,
  };
}

function isAiProvenance(provenance) {
  return (provenance?.createdBySource ?? provenance?.source) === 'ai';
}

function isAiGeneratedField(field) {
  return isAiProvenance(field?._provenance ?? field?.config?.__provenance ?? field?.provenance);
}

function hasAiGeneratedField(fields = []) {
  let found = false;
  walkFields(fields, (field) => {
    if (isAiGeneratedField(field)) {
      found = true;
    }
  });
  return found;
}

function createField(type) {
  const provenance = createProvenance('user', 'dragged');
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
    colSpan     : 24,
    refDomain   : null,
    autoGenerate: null,
    fieldRole   : null,
    children    : type === 'block' ? [] : undefined,
    _provenance : provenance,
    config      : {
      ...getDefaultConfig(type),
      __provenance: provenance,
    },
  };
}

function normalizePersistedId(id) {
  if (id == null || id === '') return null;
  const numericId = Number(id);
  return Number.isInteger(numericId) ? numericId : null;
}

function normalizeFieldKey(field) {
  return field.fieldKey ?? (typeof field.id === 'string' ? field.id : field.key) ?? '';
}

function normalizeConfig(config = {}) {
  return {
    ...config,
    options: Array.isArray(config.options)
      ? config.options.map(option => ({
        ...option,
        value: option.value ?? option.id,
        label: option.label ?? option.name ?? option.value ?? option.id,
      }))
      : config.options,
  };
}

function mapFieldFromApi(field, provenance = { source: 'api', action: 'loaded' }, previousByKey = new Map()) {
  const fieldKey = normalizeFieldKey(field);
  const previousField = previousByKey.get(fieldKey);
  const incomingProvenance =
    field._provenance ??
    field.provenance ??
    field.config?.__provenance ??
    null;
  const nextProvenance = incomingProvenance
    ? createProvenance(
      provenance.source ?? incomingProvenance.updatedBySource ?? incomingProvenance.source ?? 'api',
      provenance.action ?? incomingProvenance.updatedAction ?? incomingProvenance.sourceAction ?? 'loaded',
      { ...field, _provenance: incomingProvenance }
    )
    : createProvenance(provenance.source ?? 'api', provenance.action ?? 'loaded', previousField);
  const config = normalizeConfig(field.config ?? {});

  return {
    _id         : nanoid(),
    id          : normalizePersistedId(field.id),
    fieldKey,
    label       : field.label ?? fieldKey,
    inputType   : field.inputType,
    isRequired  : field.isRequired  ?? false,
    isSearchable: field.isSearchable ?? false,
    isIndexed   : field.isIndexed   ?? false,
    sortOrder   : field.sortOrder   ?? 0,
    enabled     : field.enabled     ?? true,
    config      : {
      ...config,
      __provenance: nextProvenance,
    },
    refDomain   : field.refDomain   ?? null,
    autoGenerate: field.autoGenerate ?? null,
    colSpan     : field.colSpan     ?? 24,
    fieldRole   : field.fieldRole   ?? null,
    children    : Array.isArray(field.children)
      ? field.children.map(child => mapFieldFromApi(child, provenance, previousByKey))
      : (field.inputType === 'block' ? [] : undefined),
    _provenance : nextProvenance,
  };
}

function buildPreviousFieldMap(fields = []) {
  const map = new Map();
  walkFields(fields, (field) => {
    if (field.fieldKey) {
      map.set(field.fieldKey, field);
    }
  });
  return map;
}

function normalizeFieldList(fields = [], provenance = { source: 'api', action: 'loaded' }, previousFields = []) {
  const previousByKey = buildPreviousFieldMap(previousFields);

  return (fields ?? [])
    .filter(field => field?.inputType)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(field => mapFieldFromApi(field, provenance, previousByKey));
}

function walkFields(fields, callback, parentId = null) {
  for (const field of fields) {
    callback(field, parentId);
    if (Array.isArray(field.children) && field.children.length > 0) {
      walkFields(field.children, callback, field._id);
    }
  }
}

function findField(fields, targetId) {
  for (const field of fields) {
    if (field._id === targetId) {
      return field;
    }
    if (Array.isArray(field.children)) {
      const nested = findField(field.children, targetId);
      if (nested) return nested;
    }
  }
  return null;
}

function findContainerInfo(fields, targetId, parentId = null) {
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    if (field._id === targetId) {
      return { container: fields, index, parentId, field };
    }
    if (Array.isArray(field.children)) {
      const nested = findContainerInfo(field.children, targetId, field._id);
      if (nested) return nested;
    }
  }
  return null;
}

function serializeField(field, index) {
  const provenance = field._provenance ?? field.config?.__provenance ?? null;
  return {
    id          : field.id,
    fieldKey    : field.fieldKey,
    label       : field.label,
    inputType   : field.inputType,
    isRequired  : field.isRequired,
    isSearchable: field.isSearchable,
    isIndexed   : field.isIndexed,
    sortOrder   : index,
    enabled     : field.enabled,
    config      : {
      ...(field.config ?? {}),
      ...(provenance ? { __provenance: provenance } : {}),
    },
    refDomain   : field.refDomain,
    autoGenerate: field.autoGenerate,
    colSpan     : field.colSpan,
    fieldRole   : field.fieldRole,
    children    : Array.isArray(field.children)
      ? field.children.map((child, childIndex) => serializeField(child, childIndex))
      : undefined,
  };
}

function isDescendant(fields, ancestorId, targetId) {
  const ancestor = findField(fields, ancestorId);
  if (!ancestor || !Array.isArray(ancestor.children)) return false;
  let found = false;
  walkFields(ancestor.children, (field) => {
    if (field._id === targetId) {
      found = true;
    }
  });
  return found;
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

        state.fields = normalizeFieldList(
          template.fields ?? [],
          { source: 'api', action: 'loaded' },
          []
        );

        const savedFieldKeys = [];
        walkFields(state.fields, (field) => {
          if (field.id != null) {
            savedFieldKeys.push(field.fieldKey);
          }
        });
        state.savedFieldKeys = new Set(savedFieldKeys);
        state.selectedId = null;
      });
    },

    importGeneratedTemplate({ meta = {}, fields = [], provenance = { source: 'ai', action: 'created' } }) {
      set(state => {
        state.templateMeta = {
          ...state.templateMeta,
          ...meta,
          id: normalizePersistedId(meta.id ?? state.templateMeta.id),
        };

        state.fields = normalizeFieldList(fields, provenance, state.fields);

        state.savedFieldKeys = new Set();
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
    addField(type, atIndex, parentId = null) {
      const field = createField(type);
      set(state => {
        if (hasAiGeneratedField(state.fields)) return;
        const targetParentField = parentId ? findField(state.fields, parentId) : null;
        if (isAiGeneratedField(targetParentField)) return;

        const targetContainer = parentId
          ? (findField(state.fields, parentId)?.children ?? null)
          : state.fields;
        if (!targetContainer) return;

        if (atIndex != null) {
          targetContainer.splice(atIndex, 0, field);
        } else {
          targetContainer.push(field);
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
        const location = findContainerInfo(state.fields, _id);
        if (!location) return;
        if (isAiGeneratedField(location.field)) return;
        location.container.splice(location.index, 1);
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
        const field = findField(state.fields, _id);
        if (!field) return;
        if (isAiGeneratedField(field)) return;
        Object.assign(field, patch);
        touchProvenance(field, 'user', 'edited');
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
        const field = findField(state.fields, _id);
        if (!field) return;
        if (isAiGeneratedField(field)) return;

        const prevSlug = slugifyFieldKey(field.label);
        const shouldAutoSlug =
          field.id == null &&                      // chưa save
          (field.fieldKey === '' || field.fieldKey === prevSlug);

        field.label = newLabel;
        if (shouldAutoSlug) {
          field.fieldKey = slugifyFieldKey(newLabel);
        }
        touchProvenance(field, 'user', 'edited');
      });
    },

    /**
     * Cập nhật config của field (merge, không replace).
     * @param {string} _id
     * @param {object} configPatch
     */
    updateConfig(_id, configPatch) {
      set(state => {
        const field = findField(state.fields, _id);
        if (!field) return;
        if (isAiGeneratedField(field)) return;
        field.config = { ...field.config, ...configPatch };
        touchProvenance(field, 'user', 'edited');
      });
    },

    reorderFields(newOrder, parentId = null) {
      set(state => {
        const targetContainer = parentId
          ? (findField(state.fields, parentId)?.children ?? null)
          : state.fields;
        if (!targetContainer) return;
        const map = Object.fromEntries(targetContainer.map(f => [f._id, f]));
        const reordered = newOrder.map(id => map[id]).filter(Boolean);
        targetContainer.splice(0, targetContainer.length, ...reordered);
        reordered.forEach(field => touchProvenance(field, 'user', 'moved'));
      });
    },

    moveField(activeId, overId, targetParentId = null) {
      set(state => {
        if (!activeId) return;
        if (targetParentId && (targetParentId === activeId || isDescendant(state.fields, activeId, targetParentId))) {
          return;
        }

        const source = findContainerInfo(state.fields, activeId);
        if (!source) return;
        if (isAiGeneratedField(source.field)) return;
        const [movingField] = source.container.splice(source.index, 1);
        if (!movingField) return;

        const targetContainer = targetParentId
          ? (findField(state.fields, targetParentId)?.children ?? null)
          : state.fields;
        const targetParentField = targetParentId ? findField(state.fields, targetParentId) : null;

        if (!targetContainer || isAiGeneratedField(targetParentField)) {
          source.container.splice(source.index, 0, movingField);
          return;
        }

        if (!overId || overId === activeId) {
          targetContainer.push(movingField);
          touchProvenance(movingField, 'user', 'moved');
          return;
        }

        const overLocation = findContainerInfo(state.fields, overId);
        if (!overLocation || overLocation.parentId !== targetParentId || isAiGeneratedField(overLocation.field)) {
          targetContainer.push(movingField);
          touchProvenance(movingField, 'user', 'moved');
          return;
        }

        targetContainer.splice(overLocation.index, 0, movingField);
        touchProvenance(movingField, 'user', 'moved');
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
      return findField(fields, selectedId) ?? null;
    },

    getParentId(_id) {
      const { fields } = get();
      return findContainerInfo(fields, _id)?.parentId ?? null;
    },

    getFieldLocation(_id) {
      const { fields } = get();
      const location = findContainerInfo(fields, _id);
      return location
        ? { index: location.index, parentId: location.parentId }
        : null;
    },

    isAiGeneratedField(_id) {
      const { fields } = get();
      const field = findField(fields, _id);
      return isAiGeneratedField(field);
    },

    hasAiGeneratedField() {
      const { fields } = get();
      return hasAiGeneratedField(fields);
    },

    /**
     * Kiểm tra field_key có bị trùng trong canvas không.
     * Dùng trong FieldConfigPanel để show warning.
     * @param {string} fieldKey
     * @param {string} selfId — _id của field đang check (bỏ qua chính nó)
     */
    isDuplicateFieldKey(fieldKey, selfId) {
      const { fields } = get();
      let duplicated = false;
      walkFields(fields, (field) => {
        if (field._id !== selfId && field.fieldKey === fieldKey) {
          duplicated = true;
        }
      });
      return duplicated;
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
        fields: fields.map((f, index) => serializeField(f, index)),
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
