/**************************************************************************/
/*  tools.js                                                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import { GATEWAY } from 'configs';
import { pickBy, identity } from 'lodash'

export const getQueryParamsFromUrl = (url) => {
  if (!url) {
    return {};
  }
  var query = url.substr(1);
  var result = {};
  query.split("&").forEach(function (part) {
    var item = part.split("=");
    if (item[1]) {
      result[item[0]] = decodeURIComponent(item[1]);
    }
  });
  return result;
};

export const convertObjToSearchStr = (params) => {
  /* removes undefined, "", 0, null, ... */
  const newParams = pickBy(params, identity);
  delete newParams.resource;
  return new URLSearchParams(newParams).toString();
};

export const onSearch = (data, inputValue) =>
  !!inputValue && data?.toLowerCase()?.search(inputValue?.toLowerCase()) !== -1;

export const getStaticImageUrl = (image) => {
  if (!image) {
    return `${GATEWAY}/uploads/image-default.png`;
  }
  if (image.startsWith('http')) {
    return image;
  }

  const path = image.startsWith('/uploads') ? image : "/uploads/".concat(image);
  return String(GATEWAY).concat(path);
};

export const formatterInputNumber = (value) =>
  `${value}`
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    .replace(/\.(?=\d{0,2}$)/g, ',');

export const parserInputNumber = (value) => {
  return value ? value.replace(/\$\s?|(\.*)/g, '').replace(/(,{1})/g, '.') : '';
};

export const formatPhoneNumber = (phone) => {
  if (!phone) {
    return '';
  }
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export const calPriceOff = ({ discountValue, discountUnit, total }) => {
  if (!discountValue || !discountUnit) {
    return 0;
  }
  if (discountUnit === "money") {
    return discountValue;
  }
  return (discountValue * total) / 100;
};

export const isPositiveInteger = (value) => {
  return typeof value === 'number' 
    && Number.isInteger(value) 
    && value > 0;
};
