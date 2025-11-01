/**************************************************************************/
/*  fileUtils.js                                                          */
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

import { IMAGE_TYPES } from 'configs/localData';
import { notification, Upload } from 'antd';
import i18next from 'i18next';
import { MAX_FILE_SIZE_MB } from 'configs/constant';
import axios from 'axios';
import { getFileNameHeader } from 'api/download';

const showErrorDownloadFile = (message) => {
  notification.error({
    message: i18next.t('error.title'),
    description: message || i18next.t('error.errorDownloadFile'),
    duration: 2
  });
};

export const isImageFile = (fileName) => {
  const extension = getExtensionFile(fileName);
  if (!extension) return false;
  return IMAGE_TYPES.includes(extension.toLocaleLowerCase());
};

export const getFileNameFromUrl = (url) => url?.split('/')?.pop();
export const checkFileType = (file) => {
  if (!file.type?.trim()) {

  }
  return true;
};

export const getExtensionFile = (fileName) => {
  if (typeof fileName !== 'string' || fileName.indexOf('.') === -1) return '';
  return fileName.split('.').pop();
};

export const checkValidFileSize = (file, placeholder) => {
  const isCheckSize = Number(file.size) / 1024 / 1024 < MAX_FILE_SIZE_MB;
  if (!isCheckSize) {
    notification.error({
      message: i18next.t('error.title'),
      description: i18next.t('error.fileSize', {
        name: i18next.t(placeholder),
      }),
      duration: 2,
    });
    return Upload.LIST_IGNORE;
  }
  return true;
};

export const downloadFileByURL = async (file) => {
  return new Promise(resolve => {
    if (!file?.url) {
      showErrorDownloadFile();
      resolve({ loading: false });
    }
    try {
      axios.get(file.url, { responseType: 'blob' }).then(response => {
        const blob = response.data;
        if (!blob) {
          resolve({ loading: false });
        }
        const disposition = response.headers['content-disposition'];
        const restFileName = file.fileName || getFileNameHeader(disposition) || getFileNameFromUrl(file.url) || 'example';
        const a = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = restFileName;
        a.click();
        window.URL.revokeObjectURL(url);
        resolve({ loading: false });
      });
    } catch (error) {
      showErrorDownloadFile(error?.message);
      resolve({ loading: false });
    }
  });
};

export const getFileName = (file) =>
  file.split('/').pop()?.split('-')?.splice(1).join('-');

export const splitFile = (url) => {
  const splitUrl = url.split('.');
  const fileType = splitUrl.pop();
  const fileName = splitUrl.join('.');
  return { fileType, fileName };
};
