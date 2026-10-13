/** Local development only. Never mutates or persists the API configuration. */
export function applyDevRemoteOverride(remote, mode = process.env.NODE_ENV, raw = process.env.REACT_APP_TENANT_REMOTE_OVERRIDES) {
  if (!remote || mode !== 'development' || !raw) return remote;
  let overrides;
  try { overrides = JSON.parse(raw); } catch { throw new Error('REACT_APP_TENANT_REMOTE_OVERRIDES phải là JSON hợp lệ'); }
  if (!overrides || Array.isArray(overrides) || typeof overrides !== 'object') {
    throw new Error('Dev remote overrides phải là object remoteId → URL');
  }
  const entry = overrides[remote.id] ?? overrides[remote.scope];
  if (entry == null) return remote;
  let url;
  try { url = new URL(entry); } catch { throw new Error(`URL dev remote không hợp lệ: ${remote.id || remote.scope}`); }
  if (typeof entry !== 'string' || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Dev remote URL phải là HTTP/HTTPS và không chứa thông tin đăng nhập');
  }
  return { ...remote, remoteEntry: entry, version: '' };
}
