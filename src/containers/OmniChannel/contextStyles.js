/**************************************************************************/
/*  @/containers/OmniChannel/contextStyles.js                             */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Cột phải — ngữ cảnh khách hàng.                                        */
/**************************************************************************/

import styled, { css } from 'styled-components'
import { ACCENT } from './chatStyles'

export const ContextPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #fff;
  border-left: 1px solid #f0f0f0;
  padding: 16px;

  @media (max-width: 1400px) {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 330px;
    z-index: 10;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
    display: ${(p) => (p.$open ? 'flex' : 'none')};
  }
`

/* ---------------- Đầu cột: danh tính ---------------- */

export const IdentityHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .face {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: ${(p) => p.$bg || ACCENT};
    user-select: none;

    /* Chưa gắn: viền đứt, nền trắng — khác hẳn khách đã có hồ sơ */
    ${(p) =>
      p.$unlinked &&
      css`
        background: #fff;
        color: #8c8c8c;
        border: 1px dashed #d9d9d9;
      `}
  }

  .face img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .info {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name a {
    color: inherit;
    &:hover {
      color: ${ACCENT};
    }
  }

  .sub {
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
  }
`

/* ---------------- Thẻ kêu gọi tạo lead ---------------- */

export const CallToAction = styled.div`
  margin-top: 16px;
  padding: 20px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  text-align: center;

  .icon {
    width: 42px;
    height: 42px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #bfbfbf;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  .desc {
    margin-top: 6px;
    font-size: 12.5px;
    line-height: 1.55;
    color: #8c8c8c;
  }

  .actions {
    margin-top: 14px;
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .primary {
    background: ${ACCENT};
    border-color: ${ACCENT};

    &:hover:not(:disabled) {
      background: #0c6759 !important;
      border-color: #0c6759 !important;
    }
  }
`

/* ---------------- Tiêu đề nhóm ---------------- */

export const SectionTitle = styled.div`
  margin: 22px 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 10px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #f0f0f0;
  }
`

/* ---------------- Kênh liên hệ được ---------------- */

export const ChannelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  cursor: ${(p) => (p.$clickable ? 'pointer' : 'default')};
  transition: border-color 0.15s, background 0.15s;

  ${(p) =>
    p.$clickable &&
    css`
      &:hover {
        border-color: ${ACCENT};
        background: #f6fbf9;
      }
    `}

  .badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
  }

  .grow {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

/* Chip tình trạng cửa sổ — cùng ngôn ngữ màu với cột trái */
export const WindowChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;

  ${(p) =>
    p.$state === 'closed' &&
    css`
      color: #fff;
      background: #ff4d4f;
    `}
  ${(p) =>
    p.$state === 'urgent' &&
    css`
      color: #ad4e00;
      background: #fff2e8;
      border: 1px solid #ffbb96;
    `}
  ${(p) =>
    p.$state === 'ok' &&
    css`
      color: #ad6800;
      background: #fffbe6;
      border: 1px solid #ffe58f;
    `}
`

/* Dòng thông tin có icon ở đầu — công ty, điện thoại, phụ trách */
export const IconLine = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 0;
  font-size: 13px;
  color: #434343;

  .ico {
    color: #bfbfbf;
    font-size: 14px;
    flex-shrink: 0;
  }

  .text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  a.text {
    color: #434343;
    &:hover {
      color: ${ACCENT};
    }
  }
`

/* ---------------- Bảng thông tin nhãn/giá trị ---------------- */

export const FactRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  font-size: 13px;

  .label {
    color: #8c8c8c;
    flex-shrink: 0;
  }

  .value {
    flex: 1;
    min-width: 0;
    text-align: right;
    color: #262626;
    word-break: break-word;
  }

  .value.muted {
    color: #bfbfbf;
  }
`

/* ---------------- Khối khách hàng đã gắn ---------------- */

export const StatRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`

/* Thẻ chỉ số. Chỉ đổi màu khi CÓ VẤN ĐỀ (nợ quá hạn) — nợ bằng 0
   hay khách mới thì giữ trung tính, để màu đỏ luôn có nghĩa. */
export const StatCard = styled.div`
  flex: 1;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;

  ${(p) =>
    p.$alert &&
    css`
      border-color: #ffccc7;
      background: #fff5f5;
    `}

  .label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${(p) => (p.$alert ? '#cf1322' : '#8c8c8c')};
  }

  .value {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
    color: ${(p) => (p.$alert ? '#cf1322' : '#262626')};
  }

  .value .unit {
    font-size: 12px;
    font-weight: 500;
    color: ${(p) => (p.$alert ? '#cf1322' : '#8c8c8c')};
    margin-left: 3px;
  }

  .caption {
    margin-top: 5px;
    font-size: 11px;
    line-height: 1.4;
    color: ${(p) => (p.$alert ? '#cf1322' : '#8c8c8c')};
  }
`

export const TimelineItem = styled.a`
  display: block;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-left: 3px solid ${(p) => p.$accent};
  border-radius: 6px;
  margin-bottom: 8px;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    background: #fafafa;
    color: inherit;
    border-color: #d9d9d9;
    border-left-color: ${(p) => p.$accent};
  }

  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .code {
    font-size: 12.5px;
    font-weight: 600;
    color: ${(p) => p.$accent};
  }

  .kind {
    font-size: 10.5px;
    font-weight: 500;
    line-height: 1;
    padding: 3px 6px;
    border-radius: 4px;
    color: ${(p) => p.$accent};
    background: ${(p) => p.$tint};
  }

  .date {
    margin-left: auto;
    font-size: 11px;
    color: #8c8c8c;
    flex-shrink: 0;
  }

  .row2 {
    margin-top: 5px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .title {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: #262626;
  }

  .amount {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    color: #262626;
  }

  .foot {
    margin-top: 4px;
    font-size: 11.5px;
    color: #8c8c8c;
  }
`

/* Trạng thái rỗng của lịch sử — có nút hành động nên dùng thẻ
   viền đứt, phân biệt với vùng nội dung thật */
export const EmptyCard = styled.div`
  padding: 22px 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 10px;
  text-align: center;

  .icon {
    width: 40px;
    height: 40px;
    margin: 0 auto 12px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #bfbfbf;
    font-size: 17px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  .desc {
    margin-top: 6px;
    font-size: 12.5px;
    line-height: 1.55;
    color: #8c8c8c;
  }

  .primary {
    margin-top: 14px;
    background: ${ACCENT};
    border-color: ${ACCENT};

    &:hover:not(:disabled) {
      background: #0c6759 !important;
      border-color: #0c6759 !important;
    }
  }
`

export const PaneEmpty = styled.div`
  padding: 16px 0;
  text-align: center;
  font-size: 12.5px;
  line-height: 1.6;
  color: #bfbfbf;
`
