import { GATEWAY } from '@/configs';
import { notification } from 'antd';
import i18next from 'i18next';

const originalTitle = document.title
let titleTimer      = null
let titleInterval   = null

export function bumpTitle(displayName) {
  if (!displayName) {
    return
  }
  clearTimeout(titleTimer)
  clearInterval(titleInterval)

  let visible = true
  titleInterval = setInterval(() => {
    document.title = visible ? `💬 ${displayName}` : '🔔 Tin nhắn mới'
    visible = !visible
  }, 1000)

  titleTimer = setTimeout(() => {
    clearInterval(titleInterval)
    titleInterval = null
    document.title = originalTitle
  }, 10000)
};

export const showNotifyError = (description) => {
  notification.error({
    message: i18next.t('error.title'),
    description: i18next.t(description),
  });
};

export const onSearch = ( data, inputValue ) =>
  !!inputValue && data?.toLowerCase()?.search(inputValue?.toLowerCase()) !== -1;

export const getStaticImageUrl = (image) => {
  if (!image) {
    return `${GATEWAY}/uploads/image-default.png`;
  }
  return image && image.startsWith('http') ? image : GATEWAY.concat(image.startsWith('/uploads') ? image : "/uploads/".concat(image));
};

export const formatterInputNumber = (value) =>
  `${value}`
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    .replace(/\.(?=\d{0,2}$)/g, ',');

export const parserInputNumber = (value) => {
  return value ? value.replace(/\$\s?|(\.*)/g, '').replace(/(,{1})/g, '.') : '';
};
