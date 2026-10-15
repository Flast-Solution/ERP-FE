export const DEFAULT_ADDITIONAL_KEYS = ['Color', 'Color standard', 'Handtouch standard', 'Finising'];
const keyOf = key => String(key ?? '').trim().toLowerCase();
export function withDefaultAdditionalFields(entries = []) {
 const rows = Array.isArray(entries) ? entries : [];
 return [
  ...DEFAULT_ADDITIONAL_KEYS.map(key => ({key, value:rows.find(row => keyOf(row.key) === keyOf(key))?.value ?? ''})),
  ...rows.filter(row => !DEFAULT_ADDITIONAL_KEYS.some(key => keyOf(key) === keyOf(row.key))).map(row=>({...row,value:row.value ?? ''})),
 ];
}
