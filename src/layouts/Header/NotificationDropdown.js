import { useState } from 'react';
import { Badge, Dropdown, Empty } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { NotificationPanel } from './styles';

const NOTIFICATION_ICONS = {
  approve: <ClockCircleOutlined />,
  done: <CheckOutlined />,
  alert: <WarningOutlined />,
  info: <InfoCircleOutlined />,
};

const formatNotificationTime = (value) => {
  if (!value) return '';
  const date = moment(value);
  return date.isValid() ? date.fromNow() : '';
};

const NotificationDropdown = ({
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onSelect,
  onViewAll,
  onRequestPermission,
}) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [readIds, setReadIds] = useState(() => new Set());

  const isUnread = (notification) => !notification?.read && !readIds.has(notification?.id);
  const unreadCount = notifications.filter(isUnread).length;
  const visibleNotifications = filter === 'unread' ? notifications.filter(isUnread) : notifications;

  const markRead = (notification) => {
    if (isUnread(notification)) {
      setReadIds(previous => new Set(previous).add(notification.id));
      onMarkRead?.(notification);
    }
    onSelect?.(notification);
  };

  const markAllRead = () => {
    setReadIds(previous => {
      const next = new Set(previous);
      notifications.forEach(notification => next.add(notification.id));
      return next;
    });
    onMarkAllRead?.(notifications.filter(isUnread));
  };

  const panel = (
    <NotificationPanel>
      <div className="notification-panel__header">
        <div className="notification-panel__heading">
          <h3>Thông báo</h3>
          <button type="button" className="notification-panel__mark-all" onClick={markAllRead} disabled={!unreadCount}>
            Đánh dấu đã đọc tất cả
          </button>
        </div>
        <div className="notification-panel__tabs" role="tablist" aria-label="Bộ lọc thông báo">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'unread'}
            className={filter === 'unread' ? 'active' : ''}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc <span>({unreadCount})</span>
          </button>
        </div>
      </div>

      <div className="notification-panel__list">
        {visibleNotifications.length ? visibleNotifications.map(notification => {
          const unread = isUnread(notification);
          const type = NOTIFICATION_ICONS[notification?.type] ? notification.type : 'info';
          return (
            <button
              type="button"
              key={notification.id}
              className={`notification-panel__item${unread ? ' unread' : ''}`}
              onClick={() => markRead(notification)}
            >
              <span className={`notification-panel__icon type-${type}`}>
                {NOTIFICATION_ICONS[type]}
              </span>
              <span className="notification-panel__content">
                <span className="notification-panel__title">{notification.title}</span>
                {notification.description && (
                  <span className="notification-panel__description">{notification.description}</span>
                )}
                <span className="notification-panel__meta">{formatNotificationTime(notification.createdAt)}</span>
              </span>
              {unread && <span className="notification-panel__unread-dot" aria-label="Chưa đọc" />}
            </button>
          );
        }) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo'}
          />
        )}
      </div>

      <div className="notification-panel__footer">
        <button type="button" onClick={onViewAll}>Xem tất cả thông báo</button>
      </div>
    </NotificationPanel>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={() => panel}
    >
      <button
        type="button"
      className="notification-trigger"
      aria-label="Thông báo"
      aria-haspopup="true"
      aria-expanded={open}
      onClick={onRequestPermission}
    >
        <Badge count={unreadCount} size="small" overflowCount={99}>
          <BellOutlined />
        </Badge>
      </button>
    </Dropdown>
  );
};

export default NotificationDropdown;
