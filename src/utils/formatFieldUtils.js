/**************************************************************************/
/*  formatFieldUtils.js                                                   */
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

import i18next from 'i18next';
import {
  PAYMENT_STATUS_MAP_KEYS,
  CONTRACT_TYPES, CONTRACT_STATUS
} from 'configs/localData';
import { Tag } from 'antd';
import { formatDataI18n } from './dataUtils';
import UserInfo from 'components/common/UserInfo';

export const formatPaymentStatus = (data) => {
  if (!data) {
    return null;
  }
  const restItem = PAYMENT_STATUS_MAP_KEYS[data];
  return (
    <Tag color={restItem?.color}>
      {restItem?.text ? i18next.t(restItem.text) : data}
    </Tag>
  );
};

export const formatContractType = (data) => {
  const restItem = CONTRACT_TYPES.find(item => item.value === data);
  return restItem?.text ? (
    <Tag color={restItem?.color || 'blue'}>{i18next.t(restItem?.text)}</Tag>
  ) : null;
};

export const formatContractTemplate = (data) => {
  return data ? (
    <Tag color="blue">{formatDataI18n(data.displayName)}</Tag>
  ) : null;
};

export const formatContractStatus = (data) => {
  const contractStatusItem = CONTRACT_STATUS.find(item => item.value === data);
  return contractStatusItem?.text ? (
    <Tag color={contractStatusItem.color}>
      {i18next.t(contractStatusItem.text)}
    </Tag>
  ) : null;
};

export const formatCustomerOrTeamInfo = ({ data, size }) => (
  <UserInfo
    item={data}
    path={`/customer/show?id=${data?.id}`}
    noteProp="email"
    size={size}
  />
);
