import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Image, Space, Spin, Typography } from 'antd';
import { bannerImageUrl } from './config';

export const isBannerApiImage = (source) => {
  try {
    const url = new URL(source, window.location.origin);
    const api = new URL(axios.defaults.baseURL || '/api', window.location.origin);
    return (
      /\/(?:erp|upload)\/folder\/view(?:\/|\?)/i.test(url.pathname) &&
      (url.origin === api.origin || url.origin === window.location.origin)
    );
  } catch {
    return false;
  }
};

export default function BannerImage({ value, ...imageProps }) {
  const source = bannerImageUrl(value);
  const [preview, setPreview] = useState({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!source || !isBannerApiImage(source)) return;
    let active = true;
    let objectUrl;
    const controller = new AbortController();
    setPreview({ source, loading: true });
    axios
      .get(source, { baseURL: '', responseType: 'blob', signal: controller.signal })
      .then((response) => {
        if (!active) return;
        let blob = response.data;
        if (!(blob instanceof Blob) || /(?:json|text\/html)/i.test(blob.type))
          throw new Error('API không trả về ảnh');
        if (!blob.type || blob.type === 'application/octet-stream') {
          const extension = source.split(/[?#]/)[0].split('.').pop().toLowerCase();
          const mime = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            avif: 'image/avif',
          }[extension];
          if (mime) blob = new Blob([blob], { type: mime });
        }
        objectUrl = URL.createObjectURL(blob);
        setPreview({ source, url: objectUrl });
      })
      .catch((error) => {
        if (active)
          setPreview({
            source,
            error: error.response?.status
              ? `Không tải được ảnh (HTTP ${error.response.status})`
              : 'Không tải được ảnh từ máy chủ',
          });
      });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source, attempt]);
  if (!source) return null;
  if (!isBannerApiImage(source)) return <Image {...imageProps} src={source} />;
  if (preview.source !== source || preview.loading) return <Spin size="small" />;
  if (preview.error)
    return (
      <Space direction="vertical">
        <Typography.Text type="secondary">{preview.error}</Typography.Text>
        <Button size="small" onClick={() => setAttempt((current) => current + 1)}>
          Thử lại
        </Button>
      </Space>
    );
  return <Image {...imageProps} src={preview.url} />;
}
