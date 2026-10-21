import React from 'react';
import { Button, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { findEntityAlerts, openBusinessAlert } from '../entrypoint';
import useGetMe from '@/hooks/useGetMe';
import { notificationUserKey, useEntityAlertStore } from '../entityAlertStore';
export default function AlertLink({ entityId, entityKind }) {
  const { user } = useGetMe();
  const key = notificationUserKey(user);
  const hasAlerts = useEntityAlertStore(
    (state) =>
      state.key === key && findEntityAlerts(state.alerts, { entityId, entityKind }).length > 0,
  );
  if (entityId == null) return null;
  return (
    <Tooltip title={hasAlerts ? 'Cảnh báo của đối tượng' : 'Đối tượng chưa có cảnh báo'}>
      <span onClick={(event) => event.stopPropagation()}>
        <Button
          size="small"
          disabled={!hasAlerts}
          aria-label="Xem cảnh báo"
          icon={<BellOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            openBusinessAlert({ entityId, entityKind });
          }}
        />
      </span>
    </Tooltip>
  );
}
