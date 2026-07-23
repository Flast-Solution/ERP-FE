/**************************************************************************/
/*  index.js                                                              */
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
/* có trách nhiệm                                                        */
/*******************************************************************************/

import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from '@/App';
import { GATEWAY } from '@/configs';
import { handleUnauthorized, hasAccessToken } from '@/utils/sessionExpiry';

// RequestUtils (@flast-erp/core) builds url as baseURL + path, then calls axios.get(url).
// With a relative baseURL like '/api', axios combines baseURL again → /api/api/...
// Absolute baseURL avoids the second merge (same as the old http://host:9080/api setup).
const resolveApiBaseUrl = (gateway) => {
  if (/^https?:\/\//i.test(gateway)) return gateway;
  return `${window.location.origin}${gateway}`;
};

axios.defaults.withCredentials = true;
axios.defaults.baseURL = resolveApiBaseUrl(GATEWAY);
axios.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401 && hasAccessToken()) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
