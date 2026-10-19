import { resolveRuntimeAssetUrl, toUploadFile } from '@/containers/PreviewModal/uploadUtils';
export const BANNER_POSITIONS = [
  { value: 'TOP', label: 'Trên cùng (TOP)' },
  { value: 'RIGHT', label: 'Bên phải (RIGHT)' },
  { value: 'BOTTOM', label: 'Dưới cùng (BOTTOM)' },
  { value: 'LEFT', label: 'Bên trái (LEFT)' },
  { value: 'CENTER', label: 'Chính giữa (CENTER)' },
];

export const bannerImageUrl = value => /^https?:\/\//i.test(value || '') || /^\/(?!\/)/.test(value || '') ? resolveRuntimeAssetUrl(value) : toUploadFile(value)?.url;

export const bannerImages = value => (Array.isArray(value) ? value : typeof value === 'string' ? [value] : []).filter(url => typeof url === 'string' && url.trim()).map(url => url.trim());
