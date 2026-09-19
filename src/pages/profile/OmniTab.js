/**************************************************************************/
/*  @/containers/Profile/OmniTab.js                                       */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Cài đặt kênh tin nhắn: nối Zalo OA / Facebook fanpage.                 */
/*                                                                        */
/* Ba hành động, KHÁC nhau về mức độ:                                     */
/*   Ngắt  — ngừng nhận tin, giữ lịch sử, nối lại được bất cứ lúc nào.    */
/*   Nối lại — cấp quyền lại sau khi token hỏng hoặc đã ngắt.             */
/*   Xoá   — gỡ hẳn kênh khỏi danh sách. Chỉ cho phép khi đã ngắt, để     */
/*           admin buộc phải đi qua một bước có thể hoàn tác trước.       */
/**************************************************************************/

import { useCallback, useEffect, useState } from 'react'
import { Button, Modal, Skeleton, Tooltip, message } from 'antd'
import {
  ApiOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import { omniApi } from '@/services/omniService'
import { CHANNEL_STATUS, CHANNEL_TYPE } from '@/store/omniStore'
import {
  TabWrapper,
  EmptyCard,
  ChannelCard,
  StatusChip,
  AddRow,
  PickChannel,
} from './omniTabStyles'

const STATUS_META = {
  [CHANNEL_STATUS.ACTIVE]: { state: 'active', text: 'Đang chạy' },
  [CHANNEL_STATUS.TOKEN_ERROR]: { state: 'error', text: 'Lỗi kết nối' },
  [CHANNEL_STATUS.DISCONNECTED]: { state: 'off', text: 'Đã ngắt' },
}

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
]

const OmniTab = () => {

  const [ channels, setChannels ] = useState(null)
  const [ picking, setPicking ] = useState(false)
  const [ connecting, setConnecting ] = useState(null)

  const load = useCallback(async () => {
    try {
      setChannels(await omniApi.fetchChannels())
    } catch {
      message.error('Không tải được danh sách kênh')
      setChannels([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /* BE trả URL OAuth, chuyển hướng cả tab. Sau khi nền tảng gọi lại
     callback, người dùng quay về đúng trang này. */
  const handleConnect = useCallback(async (channelType) => {
    setConnecting(channelType)
    try {
      const { url } = await omniApi.startConnect(channelType)
      window.location.href = url
    } catch {
      message.error('Không mở được trang xác thực')
      setConnecting(null)
    }
  }, [])

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
          await omniApi.disconnectChannel(channel.id)
          message.success('Đã ngắt kết nối')
          load()
        },
      })
    },
    [load]
  )

  /* Xoá không hoàn tác được — nói rõ hệ quả, và bắt admin gõ tên
     kênh thì thừa với thao tác này, nên chỉ dùng nút đỏ + mô tả. */
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
          await omniApi.deleteChannel(channel.id)
          message.success('Đã xoá kênh')
          load()
        },
      })
    },
    [load]
  )

  if (channels === null) {
    return (
      <TabWrapper>
        <Skeleton active paragraph={{ rows: 4 }} />
      </TabWrapper>
    )
  }

  const hasWorkingChannel = channels.some((c) => c.status !== CHANNEL_STATUS.DISCONNECTED)

  return (
    <TabWrapper>
      <div className="head">
        <div className="title">Kênh tin nhắn</div>
        <div className="desc">
          Nối Zalo OA và Facebook fanpage để tin nhắn khách chảy về hộp thư chung. Mỗi kênh cần
          được cấp quyền một lần, sau đó hệ thống tự làm mới kết nối.
        </div>
      </div>

      {channels.length === 0 ? (
        <EmptyCard>
          <div className="icon">
            <ApiOutlined />
          </div>
          <div className="title">Chưa nối kênh nào</div>
          <div className="desc">
            Nối Zalo OA hoặc Facebook fanpage để tin nhắn khách chảy về đây.
          </div>
          <Button
            type="primary"
            className="primary"
            icon={<PlusOutlined />}
            onClick={() => setPicking(true)}
          >
            Nối kênh
          </Button>
        </EmptyCard>
      ) : (
        <>
          {!hasWorkingChannel && (
            <div style={{ marginBottom: 12, fontSize: 13, color: '#cf1322' }}>
              Tất cả kênh đang ngắt — hộp thư không nhận được tin mới.
            </div>
          )}

          { channels.map((channel) => {
            const meta = STATUS_META[channel.status] || STATUS_META[CHANNEL_STATUS.DISCONNECTED]
            const isError = channel.status === CHANNEL_STATUS.TOKEN_ERROR
            const isOff = channel.status === CHANNEL_STATUS.DISCONNECTED

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

                  {/* Chỉ xoá được kênh đã ngắt — buộc đi qua một bước
                      hoàn tác được trước khi tới bước không hoàn tác. */}
                  <Tooltip
                    title={isOff ? 'Xoá khỏi danh sách' : 'Ngắt kết nối trước khi xoá'}
                  >
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
            )
          })}

          <AddRow>
            <Button icon={<PlusOutlined />} onClick={() => setPicking(true)}>
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
        onCancel={() => setPicking(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {CHANNEL_OPTIONS.map((opt) => (
            <PickChannel
              key={opt.type}
              type="button"
              $channelType={opt.type}
              disabled={connecting !== null}
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
        </div>
      </Modal>
    </TabWrapper>
  )
}

export default OmniTab
