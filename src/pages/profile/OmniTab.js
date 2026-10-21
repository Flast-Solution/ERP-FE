/**************************************************************************/
/*  @/containers/Profile/OmniTab.js                                       */
/**************************************************************************/

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Modal, Skeleton, Tooltip, message } from 'antd';
import {
  ApiOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  PhoneOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { omniApi } from '@/services/omniService';
import { CHANNEL_STATUS, CHANNEL_TYPE } from '@/store/omniStore';
import {
  TabWrapper,
  EmptyCard,
  ChannelCard,
  StatusChip,
  AddRow,
  PickChannel,
} from './omniTabStyles';

import useGetMe from '@/hooks/useGetMe';
import { saveCallCenterExtension } from './callCenterService';

const OAUTH_MSG_KEY = 'omni-oauth-result';
const STATUS_META = {
  [CHANNEL_STATUS.ACTIVE]: { state: 'active', text: 'Đang chạy' },
  [CHANNEL_STATUS.TOKEN_ERROR]: { state: 'error', text: 'Lỗi kết nối' },
  [CHANNEL_STATUS.DISCONNECTED]: { state: 'off', text: 'Đã ngắt' },
};

const CHANNEL_OPTIONS = [
  {
    type: CHANNEL_TYPE.ZALO_OA,
    initial: 'Z',
    name: 'Zalo Official Account',
    desc: 'Cần OA đã xác thực doanh nghiệp',
  },
  {
    type: CHANNEL_TYPE.FACEBOOK,
    initial: 'f',
    name: 'Facebook Fanpage',
    desc: 'Cần quyền quản trị trang',
  },
];

/* Đọc kết quả OAuth BE redirect về, xoá param khỏi URL. */
const consumeOAuthResult = () => {
  const url = new URL(window.location.href);
  const connected = url.searchParams.get('connected');
  const error = url.searchParams.get('error');
  if (connected === null && error === null) {
    return null;
  }
  url.searchParams.delete('connected');
  url.searchParams.delete('error');
  window.history.replaceState(window.history.state, '', url);
  return error !== null ? 'error' : 'success';
};

const OmniTab = () => {
  const { user, setMe } = useGetMe();
  const savedExtension = String(user?.sipExt ?? '').trim();
  const [callCenterSelected, setCallCenterSelected] = useState(false);
  const [sipExt, setSipExt] = useState('');
  const [savingExtension, setSavingExtension] = useState(false);
  const openPicker = () => {
    setCallCenterSelected(false);
    setSipExt(savedExtension);
    setPicking(true);
  };
  const saveExtension = async () => {
    if (savingExtension) return;
    setSavingExtension(true);
    try {
      const saved = await saveCallCenterExtension(user, sipExt);
      setMe({ ...user, sipExt: saved });
      setPicking(false);
      message.success('Đã lưu máy nhánh tổng đài');
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingExtension(false);
    }
  };

  const [channels, setChannels] = useState(null);
  const [picking, setPicking] = useState(false);
  const [connecting, setConnecting] = useState(null);

  const load = useCallback(async () => {
    try {
      setChannels(await omniApi.fetchChannels());
    } catch {
      message.error('Không tải được danh sách kênh');
      setChannels([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const result = consumeOAuthResult();
    if (result === 'success') {
      message.success({ key: OAUTH_MSG_KEY, content: 'Nối kênh thành công' });
    }
    if (result === 'error') {
      const ctx = 'Nối kênh thất bại. Vui lòng thử lại hoặc kiểm tra quyền quản trị kênh.';
      message.error({ key: OAUTH_MSG_KEY, content: ctx });
    }
  }, []);

  /* BE trả URL OAuth, chuyển hướng cả tab. */
  const handleConnect = useCallback(async (channelType) => {
    setConnecting(channelType);
    try {
      const { url } = await omniApi.startConnect(channelType);
      window.location.href = url;
    } catch {
      message.error('Không mở được trang xác thực');
      setConnecting(null);
    }
  }, []);

  const handleDisconnect = useCallback(
    (channel) => {
      Modal.confirm({
        title: `Ngắt kết nối ${channel.name}?`,
        icon: <ExclamationCircleOutlined />,
        content:
          'Tin nhắn mới từ kênh này sẽ không về hộp thư nữa. Lịch sử hội thoại cũ vẫn được giữ và xem lại được.',
        okText: 'Ngắt kết nối',
        okButtonProps: { danger: true },
        cancelText: 'Huỷ',
        onOk: async () => {
          await omniApi.disconnectChannel(channel.id);
          message.success('Đã ngắt kết nối');
          load();
        },
      });
    },
    [load],
  );

  const handleDelete = useCallback(
    (channel) => {
      Modal.confirm({
        title: `Xoá ${channel.name} khỏi danh sách?`,
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        content:
          'Kênh sẽ biến mất khỏi trang này. Lịch sử hội thoại cũ vẫn giữ trong hộp thư, nhưng muốn nhận tin trở lại thì phải cấp quyền từ đầu.',
        okText: 'Xoá kênh',
        okButtonProps: { danger: true },
        cancelText: 'Huỷ',
        onOk: async () => {
          await omniApi.deleteChannel(channel.id);
          message.success('Đã xoá kênh');
          load();
        },
      });
    },
    [load],
  );

  if (channels === null) {
    return (
      <TabWrapper>
        <Skeleton active paragraph={{ rows: 4 }} />
      </TabWrapper>
    );
  }

  const hasWorkingChannel = channels.some((c) => c.status !== CHANNEL_STATUS.DISCONNECTED);
  return (
    <TabWrapper>
      <div className="head">
        <div className="title">Kênh tương tác</div>
        <div className="desc">
          Kết nối Zalo OA, Facebook Fanpage và cấu hình máy nhánh tổng đài cho tài khoản để nhắn
          tin, nghe và gọi khách hàng.
        </div>
      </div>

      {savedExtension && (
        <ChannelCard>
          <div className="badge">
            <PhoneOutlined />
          </div>
          <div className="info">
            <div className="name">Tổng đài</div>
            <div className="meta">Máy nhánh: {savedExtension}</div>
          </div>
          <div className="actions">
            <Button
              onClick={() => {
                setSipExt(savedExtension);
                setCallCenterSelected(true);
                setPicking(true);
              }}
            >
              Chỉnh sửa
            </Button>
          </div>
        </ChannelCard>
      )}
      {channels.length === 0 && !savedExtension ? (
        <EmptyCard>
          <div className="icon">
            <ApiOutlined />
          </div>
          <div className="title">Chưa nối kênh nào</div>
          <div className="desc">
            Kết nối Zalo OA, Facebook Fanpage hoặc thêm máy nhánh tổng đài.
          </div>
          <Button type="primary" className="primary" icon={<PlusOutlined />} onClick={openPicker}>
            Nối kênh
          </Button>
        </EmptyCard>
      ) : (
        <>
          {channels.length > 0 && !hasWorkingChannel && (
            <div style={{ marginBottom: 12, fontSize: 13, color: '#cf1322' }}>
              Tất cả kênh đang ngắt — hộp thư không nhận được tin mới.
            </div>
          )}

          {channels.map((channel) => {
            const meta = STATUS_META[channel.status] || STATUS_META[CHANNEL_STATUS.DISCONNECTED];
            const isError = channel.status === CHANNEL_STATUS.TOKEN_ERROR;
            const isOff = channel.status === CHANNEL_STATUS.DISCONNECTED;

            return (
              <ChannelCard
                key={channel.id}
                $channelType={channel.channelType}
                $error={isError}
                $off={isOff}
              >
                <div className="badge">
                  {channel.channelType === CHANNEL_TYPE.FACEBOOK ? 'f' : 'Z'}
                </div>

                <div className="info">
                  <div className="name">
                    {channel.name}
                    <StatusChip $state={meta.state}>{meta.text}</StatusChip>
                  </div>
                  <div className="meta">
                    {isError
                      ? `Mất kết nối từ ${moment(channel.tokenExpireAt).format('HH:mm DD/MM')} — tin mới không tải về`
                      : isOff
                        ? 'Không nhận tin mới. Lịch sử cũ vẫn xem được.'
                        : `ID ${channel.externalId}`}
                  </div>
                </div>

                <div className="actions">
                  {isError && (
                    <Button
                      type="primary"
                      danger
                      icon={<ReloadOutlined />}
                      loading={connecting === channel.channelType}
                      onClick={() => handleConnect(channel.channelType)}
                    >
                      Nối lại
                    </Button>
                  )}

                  {isOff && (
                    <Button
                      icon={<ReloadOutlined />}
                      loading={connecting === channel.channelType}
                      onClick={() => handleConnect(channel.channelType)}
                    >
                      Nối lại
                    </Button>
                  )}

                  {!isOff && (
                    <Tooltip title="Ngắt kết nối">
                      <Button
                        type="text"
                        icon={<DisconnectOutlined />}
                        onClick={() => handleDisconnect(channel)}
                      />
                    </Tooltip>
                  )}

                  <Tooltip title={isOff ? 'Xoá khỏi danh sách' : 'Ngắt kết nối trước khi xoá'}>
                    <Button
                      type="text"
                      danger
                      disabled={!isOff}
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(channel)}
                    />
                  </Tooltip>
                </div>
              </ChannelCard>
            );
          })}

          <AddRow>
            <Button icon={<PlusOutlined />} onClick={openPicker}>
              Nối thêm kênh
            </Button>
          </AddRow>
        </>
      )}

      <Modal
        open={picking}
        title="Chọn loại kênh"
        footer={null}
        width={520}
        onCancel={() => {
          if (!savingExtension) setPicking(false);
        }}
        closable={!savingExtension}
        maskClosable={!savingExtension}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {CHANNEL_OPTIONS.map((opt) => (
            <PickChannel
              key={opt.type}
              type="button"
              $channelType={opt.type}
              disabled={connecting !== null || savingExtension}
              onClick={() => handleConnect(opt.type)}
            >
              <span className="badge">{opt.initial}</span>
              <span>
                <span className="name">{opt.name}</span>
                <span className="desc" style={{ display: 'block' }}>
                  {opt.desc}
                </span>
              </span>
            </PickChannel>
          ))}
          <PickChannel
            type="button"
            disabled={connecting !== null || savingExtension}
            aria-pressed={callCenterSelected}
            onClick={() => setCallCenterSelected(true)}
            style={
              callCenterSelected ? { borderColor: '#0068ff', background: '#f5f9ff' } : undefined
            }
          >
            <span className="badge">
              <PhoneOutlined />
            </span>
            <span>
              <span className="name">Tổng đài</span>
              <span className="desc" style={{ display: 'block' }}>
                Cấu hình máy nhánh nghe gọi cho tài khoản
              </span>
            </span>
          </PickChannel>
          {callCenterSelected && (
            <div>
              <label htmlFor="profile-sip-extension" style={{ display: 'block', marginBottom: 8 }}>
                Máy nhánh (sipExt) <span style={{ color: '#cf1322' }}>*</span>
              </label>
              <Input
                id="profile-sip-extension"
                value={sipExt}
                onChange={(event) => setSipExt(event.target.value)}
                disabled={savingExtension}
                placeholder="Nhập máy nhánh được cấp"
                onPressEnter={saveExtension}
              />
              <Button
                type="primary"
                loading={savingExtension}
                disabled={!sipExt.trim()}
                onClick={saveExtension}
                style={{ marginTop: 12 }}
              >
                Lưu máy nhánh
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </TabWrapper>
  );
};

export default OmniTab;
