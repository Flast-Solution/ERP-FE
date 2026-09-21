/**************************************************************************/
/*  @/containers/OmniChannel/styles.js                                    */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import styled, { css, keyframes } from 'styled-components'

/* Chiều cao khả dụng: trừ header + footer của PrivateLayout */
const AVAILABLE_HEIGHT = 'calc(100vh - 168px)'

export const InboxWrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${(p) => p.$contextOpen 
    ? '300px minmax(0, 1fr) 320px' 
    : '300px minmax(0, 1fr)'
  };
  transition: grid-template-columns 0.18s ease;
  height: ${AVAILABLE_HEIGHT};
  min-height: 0;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;

  @media (max-width: 1400px) {
    grid-template-columns: 280px minmax(0, 1fr) !important;
  }

  @media (max-width: 992px) {
    grid-template-columns: minmax(0, 1fr) !important;
  }
`

/* ====================== Cột trái ====================== */

export const ListPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid #f0f0f0;

  @media (max-width: 992px) {
    display: ${(p) => (p.$mobileActive ? 'flex' : 'none')};
  }

  .filter-bar {
    padding: 10px 12px;
    border-bottom: 1px solid #f5f5f5;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-row {
    display: flex;
    gap: 6px;
  }

  .scroll-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`

export const ConversationItem = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #fafafa;
  transition: background 0.15s;

  &:hover {
    background: #fafafa;
  }

  ${(p) =>
    p.$active &&
    css`
      background: #e6f4ff;
      &:hover {
        background: #e6f4ff;
      }
    `}

  .avatar-slot {
    position: relative;
    flex-shrink: 0;
  }

  /* Huy hiệu kênh nằm đè góc avatar — sale phải biết ngay
     đang nhìn tin từ kênh nào trước khi đọc nội dung */
  .channel-dot {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 600;
    color: #fff;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
  }

  .body {
    flex: 1;
    min-width: 0;
  }

  .line-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .name {
    font-weight: ${(p) => (p.$unread ? 600 : 500)};
    color: #262626;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .time {
    font-size: 11px;
    color: #8c8c8c;
    flex-shrink: 0;
  }

  .snippet {
    margin-top: 2px;
    font-size: 12px;
    color: ${(p) => (p.$unread ? '#434343' : '#8c8c8c')};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .line-bottom {
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .assignee {
    font-size: 11px;
    color: #8c8c8c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

/* ====================== Cột giữa ====================== */

export const ChatPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 992px) {
    display: ${(p) => (p.$mobileActive ? 'flex' : 'none')};
  }

  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .chat-header .title {
    flex: 1;
    min-width: 0;
  }

  .chat-header .name {
    font-weight: 600;
    font-size: 15px;
    color: #262626;
  }

  .chat-header .sub {
    font-size: 12px;
    color: #8c8c8c;
  }

  .thread {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 16px;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .composer {
    flex-shrink: 0;
    border-top: 1px solid #f0f0f0;
    padding: 10px 12px;
  }

  .composer-actions {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
`

/* Thanh cửa sổ trả lời — điểm nhấn duy nhất của màn hình.
   Sale mất cửa sổ là mất khách, nên nó được quyền gây chú ý. */
export const WindowBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  font-size: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid transparent;

  ${(p) =>
    p.$state === 'closed' &&
    css`
      background: #fff1f0;
      color: #cf1322;
      border-bottom-color: #ffccc7;
    `}
  ${(p) =>
    p.$state === 'urgent' &&
    css`
      background: #fff7e6;
      color: #d46b08;
      border-bottom-color: #ffe7ba;
      .dot {
        animation: ${pulse} 1.4s ease-in-out infinite;
      }
    `}
  ${(p) =>
    p.$state === 'ok' &&
    css`
      background: #f6ffed;
      color: #389e0d;
      border-bottom-color: #d9f7be;
    `}

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
`

export const Bubble = styled.div`
  max-width: 68%;
  align-self: ${(p) => (p.$outbound ? 'flex-end' : 'flex-start')};

  .sender {
    font-size: 11px;
    color: #8c8c8c;
    margin-bottom: 2px;
    text-align: ${(p) => (p.$outbound ? 'right' : 'left')};
  }

  .content {
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    background: ${(p) => (p.$outbound ? '#1677ff' : '#fff')};
    color: ${(p) => (p.$outbound ? '#fff' : '#262626')};
    border: 1px solid ${(p) => (p.$outbound ? '#1677ff' : '#f0f0f0')};

    ${(p) =>
      p.$failed &&
      css`
        background: #fff1f0;
        color: #cf1322;
        border-color: #ffccc7;
      `}
  }

  .attachment img {
    max-width: 240px;
    border-radius: 8px;
    display: block;
  }

  .meta {
    margin-top: 3px;
    font-size: 11px;
    color: #bfbfbf;
    text-align: ${(p) => (p.$outbound ? 'right' : 'left')};
  }
`

/* ====================== Cột phải ====================== */

export const ContextPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border-left: 1px solid #f0f0f0;
  padding: 16px;
  gap: 16px;

  @media (max-width: 1400px) {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 320px;
    background: #fff;
    z-index: 10;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
    display: ${(p) => (p.$open ? 'flex' : 'none')};
  }

  .block-title {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 8px;
  }

  .customer-name {
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .customer-meta {
    font-size: 13px;
    color: #595959;
    margin-top: 2px;
  }

  .stat-row {
    display: flex;
    gap: 16px;
    margin-top: 12px;
  }

  .stat {
    flex: 1;
  }

  .stat .label {
    font-size: 11px;
    color: #8c8c8c;
  }

  .stat .value {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .stat.debt .value {
    color: ${(p) => (p.$hasDebt ? '#cf1322' : '#262626')};
  }
`

/* Mỗi mục lịch sử gắn với một cột màu theo loại —
   lead / cơ hội / đơn hàng phân biệt bằng cấu trúc, không bằng nhãn chữ hoa */
export const TimelineItem = styled.a`
  display: block;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-left: 3px solid ${(p) => p.$accent};
  border-radius: 6px;
  margin-bottom: 8px;
  color: inherit;
  transition: border-color 0.15s;

  &:hover {
    border-color: #d9d9d9;
    border-left-color: ${(p) => p.$accent};
    color: inherit;
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .code {
    font-size: 11px;
    color: #8c8c8c;
  }

  .title {
    font-size: 13px;
    color: #262626;
    margin-top: 2px;
  }

  .amount {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
    white-space: nowrap;
  }

  .foot {
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #8c8c8c;
  }
`

export const SiblingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    border-color: #1677ff;
    background: #f0f7ff;
  }

  .grow {
    flex: 1;
    min-width: 0;
  }
`

export const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8c8c8c;
  font-size: 14px;
  padding: 24px;
  text-align: center;
`
