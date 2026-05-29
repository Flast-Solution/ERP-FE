import union from 'lodash/union';
import { TeamOutlined } from '@ant-design/icons';
import { getStaticImageUrl } from './tools';
import GridPhotos from 'components/common/GridPhotos';
import i18next from 'i18next';
import { useEffect, useState } from 'react';
import ResourceService from 'services/ResourceService';
import { arrayEmpty } from './dataUtils';
import { 
  PACKAGE_TYPE_UNITS_CONST, BOOKING_STATUS_MAP_KEYS, 
  EXTRA_SERVICE_STATUS, CONTRACT_TYPES, CONTRACT_STATUS
} from '@/configs/localData';
import { Tag } from 'antd';
import CardService from 'services/CardService';
import { formatDataI18n } from './dataUtils';
import { formatDateDashboard } from './textUtils';
import UserInfo from 'components/common/UserInfo';

export const formatGallery = (thumbnail, gallery = []) => {
  let images = [];
  if (thumbnail) {
    images = union([getStaticImageUrl(thumbnail)], gallery);
  } else {
    images = arrayEmpty(gallery) ? [getStaticImageUrl()] : gallery;
  }
  return (
    <GridPhotos
      isShowEmpty={false}
      isShowAll={false}
      images={images}
      maxWidth={100}
    />
  );
};

export const FormatLocation = ({ lId }) => {
  const [ text, setText ] = useState('');
  useEffect(() => {
    ResourceService.listLocation().then(locations => setText(locations.find(f => f.id === lId)?.name || 'Unknow'))
  }, [lId]);
  return text;
};

export const formatPackageTypeUnit = (data) => {
  const restText = Object.values(PACKAGE_TYPE_UNITS_CONST).find(
    item => item.value === data,
  )?.text;

  return restText ? i18next.t(restText) : data;
};

export const formatBookingStatus = (data) => {
  if (!data) return null;
  const restItem = BOOKING_STATUS_MAP_KEYS[data];
  return (
    <Tag color={restItem?.color}>
      {restItem?.text ? i18next.t(restItem.text) : data}
    </Tag>
  );
};

export const formatNamePaymentMethod = (value) => {
  return CardService.getPaymentMethod().find(f => f.value = value)?.name || 'Unknow';
}

export const formatExtraServiceOrderStatus = (data) => {
  if (!data) return null;
  const restItem = EXTRA_SERVICE_STATUS.find(item => item.value === data);
  return (
    <Tag color={restItem?.color}>
      { restItem?.text ? i18next.t(restItem.text) : data }
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

export const formatRangeDateDashboard = ( startTime, endTime ) => {
  return (
    <div>
      { startTime && (
        <div>{`${i18next.t('time.startSymbol')}: ${formatDateDashboard(
          startTime,
        )}`}</div>
      )}
      { endTime && (
        <div>{`${i18next.t('time.endSymbol')}: ${formatDateDashboard(
          endTime,
        )}`}</div>
      )}
    </div>
  );
};

export const formatCustomerOrTeamInfo = ({ data, size }) => (
  <UserInfo
    item={data}
    path={`/customer/show?id=${data?.id}`}
    noteProp="email"
    size={size}
  />
);
