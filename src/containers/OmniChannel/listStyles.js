/**************************************************************************/
/*  @/containers/OmniChannel/listStyles.js                                */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Cột trái — danh sách hội thoại.                                        */
/**************************************************************************/

import styled, { css } from 'styled-components'

export const ListPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border-right: 1px solid #f0f0f0;

  @media (max-width: 992px) {
    display: ${(p) => (p.$mobileActive ? 'flex' : 'none')};
  }
`

/* ---------------- Khối lọc trên cùng ---------------- */

export const FilterBar = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;

  .select-row {
    display: flex;
    gap: 8px;
  }

  .select-row > * {
    flex: 1;
    min-width: 0;
  }

  /* Chấm màu kênh trong ô chọn */
  .channel-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
    background: ${(p) => p.color || '#bfbfbf'};
  }
`

/* Tab phạm vi — kiểu segmented, nền xám, tab đang chọn nổi trắng */
export const ScopeTabs = styled.div`
  display: flex;
  gap: 2px;
  padding: 3px;
  margin: 0 12px;
  background: #f5f5f5;
  border-radius: 8px;
  flex-shrink: 0;

  button {
    flex: 1;
    border: 0;
    background: transparent;
    padding: 6px 4px;
    border-radius: 6px;
    font-size: 13px;
    color: #595959;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;

    &:hover {
      color: #262626;
    }
  }

  button[data-active='true'] {
    background: #fff;
    color: #262626;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .count {
    font-size: 12px;
    color: #8c8c8c;
    font-weight: 500;
  }

  button[data-active='true'] .count {
    color: #1677ff;
  }
`

/* Cảnh báo kênh mất kết nối — chỉ hiện với người có quyền cấu hình */
export const ChannelAlert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 12px 2px;
  padding: 10px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #614700;
  flex-shrink: 0;

  .icon {
    color: #d48806;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .grow {
    flex: 1;
    min-width: 0;
  }
`

/* Thanh đếm + đổi cách sắp xếp */
export const ListMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  flex-shrink: 0;

  .total {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #8c8c8c;
    text-transform: uppercase;
  }

  .sort {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #595959;
    background: none;
    border: 0;
    padding: 2px 4px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #f5f5f5;
      color: #1677ff;
    }
  }
`

export const ScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
`

/* ---------------- Một dòng hội thoại ---------------- */

export const Row = styled.div`
  position: relative;
  display: flex;
  gap: 10px;
  padding: 11px 12px 11px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;

  /* Dải mép trái: đánh dấu chưa đọc. Quét mắt nhanh hơn chữ đậm,
     và không chiếm thêm chiều cao dòng. */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${(p) => (p.$unread ? '#faad14' : 'transparent')};
  }

  &:hover {
    background: #fafafa;
  }

  ${(p) =>
    p.$active &&
    css`
      background: #e6f4ff;
      &::before {
        background: #1677ff;
      }
      &:hover {
        background: #e6f4ff;
      }
    `}
`

/* Avatar chữ cái đầu — màu sinh từ tên nên mỗi khách một màu cố định */
export const AvatarSlot = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 38px;

  .face {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: ${(p) => p.$bg};
    user-select: none;

    /* Khách chưa gắn vào hệ thống: viền đứt, nền nhạt */
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

  .channel {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
  }
`

export const RowBody = styled.div`
  flex: 1;
  min-width: 0;

  .line-name {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .name {
    font-size: 13.5px;
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
    margin-left: auto;
  }

  .snippet {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.45;
    color: ${(p) => (p.$unread ? '#434343' : '#8c8c8c')};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .line-chips {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: nowrap;
    overflow: hidden;
  }
`

/* Nhãn trạng thái — nhỏ, đặc, không dùng Tag mặc định của antd
   vì pastel quá nhạt, quét mắt không thấy */
export const StatusChip = styled.span`
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 4px;
  flex-shrink: 0;
  color: ${(p) => p.$color};
  background: ${(p) => p.$bg};
`

export const UnlinkedChip = styled.span`
  font-size: 11px;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 4px;
  color: #8c8c8c;
  background: #f5f5f5;
  border: 1px solid #f0f0f0;
  flex-shrink: 0;
`

/* Người phụ trách: chấm màu + tên, gọn hơn avatar nhỏ */
export const AssigneeChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #595959;
  min-width: 0;

  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: ${(p) => p.$bg};
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .who {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

/* Đếm ngược cửa sổ trả lời — thông tin quan trọng thứ hai của màn hình,
   nên là chip duy nhất được dùng màu đặc. */
export const WindowChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
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

  /* Dưới 10 phút: đỏ đặc như đã hết hạn, nhưng còn cứu được.
     Chữ số nhảy từng giây là tín hiệu chính, màu chỉ hỗ trợ. */
  ${(p) =>
    p.$state === 'critical' &&
    css`
      color: #fff;
      background: #f5222d;
      font-variant-numeric: tabular-nums;
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

export const UnreadDot = styled.span`
  min-width: 17px;
  height: 17px;
  padding: 0 5px;
  border-radius: 9px;
  background: #1677ff;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`
