/**************************************************************************/
/*  @/containers/OmniChannel/chatStyles.js                                */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Cột giữa — khung chat.                                                 */
/**************************************************************************/

import styled, { css } from 'styled-components'

/* Accent của module chat là xanh lá, không phải primary xanh dương của
   ERP. Lý do: bong bóng và nút Gửi xuất hiện liên tục trong 8 tiếng,
   màu dịu hơn thì đỡ mỏi mắt. */
export const ACCENT = '#0f7b6c'

export const ChatPane = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;

  @media (max-width: 992px) {
    display: ${(p) => (p.$mobileActive ? 'flex' : 'none')};
  }
`

/* ---------------- Header ---------------- */

export const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  .face {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${(p) => p.$avatarBg || ACCENT};
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .face img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .title {
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

  .sub {
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .sub .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${(p) => (p.$channelType === 2 ? '#1877f2' : '#0068ff')};
    flex-shrink: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
`

/* ---------------- Thanh cửa sổ trả lời ---------------- */

/* Mức bình thường KHÔNG tô màu: còn 41 giờ thì không có gì phải báo động.
   Chỉ khi vào vùng gấp mới đổi màu, nên lúc đó nó thực sự nổi bật. */
export const WindowBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12.5px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  color: #595959;

  .strong {
    font-weight: 600;
    color: #434343;
  }

  .hint {
    color: #8c8c8c;
  }

  ${(p) =>
    p.$state === 'urgent' &&
    css`
      background: #fff7e6;
      border-bottom-color: #ffe7ba;
      color: #ad4e00;
      .strong {
        color: #ad4e00;
      }
      .hint {
        color: #d46b08;
      }
    `}

  ${(p) =>
    p.$state === 'closed' &&
    css`
      background: #fff1f0;
      border-bottom-color: #ffccc7;
      color: #a8071a;
      .strong {
        color: #a8071a;
      }
      .hint {
        color: #cf1322;
      }
    `}
`

/* ---------------- Dòng tin ---------------- */

export const Thread = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

/* Dải phân cách ngày — kẻ ngang hai bên nhãn để cắt hẳn mạch hội thoại.
   Đường rất nhạt (#f0f0f0) để không cạnh tranh với bong bóng tin. */
export const DayDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin: 14px 0 10px;
  font-size: 12px;
  color: #8c8c8c;
  user-select: none;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #f0f0f0;
  }
`

/* Tin hệ thống: gắn đơn, đổi người phụ trách. Không phải tin gửi
   ra kênh nên không dùng bong bóng. */
export const SystemLine = styled.div`
  align-self: center;
  margin: 8px 0;
  padding: 5px 12px;
  border-radius: 12px;
  background: #f5f5f5;
  color: #8c8c8c;
  font-size: 12px;
  text-align: center;
  max-width: 80%;
`

export const Bubble = styled.div`
  max-width: 62%;
  align-self: ${(p) => (p.$outbound ? 'flex-end' : 'flex-start')};
  margin-top: ${(p) => (p.$grouped ? '2px' : '10px')};

  .sender {
    font-size: 11px;
    color: #8c8c8c;
    margin-bottom: 3px;
    text-align: ${(p) => (p.$outbound ? 'right' : 'left')};
  }

  .content {
    padding: 9px 13px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    color: #262626;

    /* Khách: xanh dương nhạt · Mình: xanh lá nhạt.
       Cả hai đều chữ đen — cuộn hàng trăm tin không chói. */
    background: ${(p) => (p.$outbound ? '#e7f5ef' : '#eaf4f8')};
    border: 1px solid ${(p) => (p.$outbound ? '#c9e8dc' : '#d3e8f0')};

    ${(p) =>
      p.$failed &&
      css`
        background: #fff1f0;
        border-color: #ffccc7;
        color: #a8071a;
      `}
  }

  .content img {
    max-width: 240px;
    border-radius: 8px;
    display: block;
  }

  .file {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .meta {
    margin-top: 4px;
    font-size: 11px;
    color: #a6a6a6;
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: ${(p) => (p.$outbound ? 'flex-end' : 'flex-start')};
  }

  .meta .read {
    color: ${ACCENT};
  }

  .retry {
    background: none;
    border: 0;
    padding: 0;
    color: #cf1322;
    font-size: 11px;
    cursor: pointer;
    text-decoration: underline;
  }
`

/* ---------------- Ô soạn tin ---------------- */

export const Composer = styled.div`
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px 14px;

  .box {
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    padding: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus-within {
      border-color: ${ACCENT};
      box-shadow: 0 0 0 2px rgba(15, 123, 108, 0.08);
    }
  }

  textarea {
    border: 0 !important;
    box-shadow: none !important;
    resize: none;
    padding: 8px 10px;

    &:focus {
      box-shadow: none !important;
    }
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 10px;
  }

  .tool {
    width: 30px;
    height: 30px;
    border: 0;
    background: none;
    border-radius: 6px;
    color: #595959;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #f5f5f5;
      color: ${ACCENT};
    }

    &:disabled {
      color: #d9d9d9;
      cursor: not-allowed;
    }
  }

  .grow {
    flex: 1;
  }

  .hint {
    font-size: 11.5px;
    color: #bfbfbf;
    margin-right: 10px;
    white-space: nowrap;
  }

  .send {
    background: ${ACCENT};
    border-color: ${ACCENT};

    &:hover:not(:disabled) {
      background: #0c6759 !important;
      border-color: #0c6759 !important;
    }
  }

  /* Cửa sổ đã đóng: thay ô nhập bằng lời giải thích, không chỉ làm mờ */
  .locked {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border: 1px dashed #ffccc7;
    border-radius: 10px;
    background: #fff5f5;
    color: #a8071a;
    font-size: 13px;
    line-height: 1.5;
  }
`

export const ChatEmpty = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #8c8c8c;
  font-size: 14px;
  padding: 24px;
  text-align: center;
`
