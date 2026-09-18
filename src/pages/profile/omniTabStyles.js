/**************************************************************************/
/*  @/page/Profile/omniTabStyles.js                                       */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Tab "Kênh tin nhắn" trong trang Hồ sơ.                                 */
/**************************************************************************/

import styled, { css } from 'styled-components'

const ACCENT = '#0f7b6c'

export const TabWrapper = styled.div`
  max-width: 720px;
  margin: 0 auto;
  .head {
    margin-bottom: 18px;
  }

  .head .title {
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .head .desc {
    margin-top: 4px;
    font-size: 13px;
    line-height: 1.6;
    color: #8c8c8c;
  }
`

/* Trạng thái chưa nối kênh nào */
export const EmptyCard = styled.div`
  padding: 56px 24px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  text-align: center;
  background: #fff;

  .icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #bfbfbf;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .desc {
    margin: 8px auto 0;
    max-width: 320px;
    font-size: 13px;
    line-height: 1.6;
    color: #8c8c8c;
  }

  .primary {
    margin-top: 18px;
    background: ${ACCENT};
    border-color: ${ACCENT};

    &:hover:not(:disabled) {
      background: #0c6759 !important;
      border-color: #0c6759 !important;
    }
  }
`

export const ChannelCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  margin-bottom: 10px;
  background: #fff;

  /* Kênh lỗi token: viền cảnh báo để admin thấy ngay khi vào trang */
  ${(p) =>
    p.$error &&
    css`
      border-color: #ffccc7;
      background: #fff5f5;
    `}

  ${(p) =>
    p.$off &&
    css`
      opacity: 0.6;
    `}

  .badge {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
  }

  .info {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meta {
    margin-top: 3px;
    font-size: 12px;
    color: #8c8c8c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
`

export const StatusChip = styled.span`
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 4px;

  ${(p) =>
    p.$state === 'active' &&
    css`
      color: #389e0d;
      background: #f6ffed;
      border: 1px solid #d9f7be;
    `}
  ${(p) =>
    p.$state === 'error' &&
    css`
      color: #fff;
      background: #ff4d4f;
    `}
  ${(p) =>
    p.$state === 'off' &&
    css`
      color: #8c8c8c;
      background: #f5f5f5;
      border: 1px solid #f0f0f0;
    `}
`

export const AddRow = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 10px;
`

/* Lựa chọn loại kênh trong popup kết nối */
export const PickChannel = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: ${ACCENT};
    background: #f6fbf9;
  }

  .badge {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  .desc {
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
  }
`