import { CUSTOMERS_TAB_KEYS } from 'configs';
import { GATEWAY } from 'configs';
import { pickBy, identity } from 'lodash'
import { notification } from 'antd';
import i18next from 'i18next';

export const showNotifyError = (description) => {
  notification.error({
    message: i18next.t('error.title'),
    description: i18next.t(description),
  });
};

export const getQueryParamsFromUrl = (url) => {
  if(!url) return {};
  var query = url.substr(1);
  var result = {};
  query.split("&").forEach(function(part) {
      var item = part.split("=");
      if(item[1]) {
        result[item[0]] = decodeURIComponent(item[1]);
      }
  });
  return result;
};

export const getTabCustomer = (pathname) => {
    if (!pathname?.includes('/customers')) return null;
    if (pathname === '/customers') return CUSTOMERS_TAB_KEYS.individuals;
    return pathname?.split('/')?.[2];
};

export const convertObjToSearchStr = (params) => {
  /* removes undefined, "", 0, null, ... */
  const newParams = pickBy(params, identity);
  delete newParams.resource;
  return new URLSearchParams(newParams).toString();
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

export const getATagHref = (url) => {
  if (!url) return '';
  return `https://${url.replace(/^(https:\/\/)|(http:\/\/)/g, '')}`;
};
