import React, { useMemo } from 'react';
import { Alert } from 'antd';
import { useParams } from 'react-router-dom';
import { RemoteLandingPage } from './WebPageRuntime';

/*
 * Xem trước site do MCP build: /m/page/base64(domain)/base64(remoteEntry.js).
 * Chỉ tải bản build từ host trong REACT_APP_SITE_PREVIEW_HOSTS — remote chạy chung origin ERP
 * nên không được tải JS từ host tuỳ ý.
 */

const allowedHosts = () =>
  String(process.env.REACT_APP_SITE_PREVIEW_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

/* Nhận cả base64 chuẩn lẫn base64url, có hoặc không padding. */
export const decodeBase64Param = (value) => {
  try {
    const normalized = String(value || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (_) {
    return '';
  }
};

export const resolvePreview = (domainParam, remoteParam, hosts = allowedHosts()) => {
  const domain = decodeBase64Param(domainParam).trim().toLowerCase();
  const remote = decodeBase64Param(remoteParam).trim();
  if (!domain || !remote) {
    return { error: 'Link xem trước không hợp lệ.' };
  }
  let url;
  try {
    url = new URL(remote);
  } catch (_) {
    return { error: 'URL bản build không hợp lệ.' };
  }
  const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocal) {
    return { error: 'Bản build phải dùng https.' };
  }
  if (!url.pathname.endsWith('/remoteEntry.js')) {
    return { error: 'URL bản build phải trỏ tới remoteEntry.js.' };
  }
  const host = url.hostname.toLowerCase();
  if (!isLocal && !hosts.includes(host)) {
    return { error: `Host ${host} chưa được phép xem trước (REACT_APP_SITE_PREVIEW_HOSTS).` };
  }
  return { domain, remote: url.toString() };
};

const SitePreviewRuntime = () => {
  const { domain: domainParam, remote: remoteParam } = useParams();
  const preview = useMemo(
    () => resolvePreview(domainParam, remoteParam),
    [domainParam, remoteParam],
  );

  if (preview.error) {
    return (
      <Alert
        style={{ margin: 32 }}
        type="error"
        showIcon
        message="Không mở được bản xem trước"
        description={preview.error}
      />
    );
  }

  const page = {
    id: `preview_${preview.domain}`,
    build: { url: preview.remote },
    updatedAt: preview.remote,
  };
  return <RemoteLandingPage page={page} />;
};

export default SitePreviewRuntime;
