import styled, { keyframes } from 'styled-components';
import { color, font } from './tokens';

const slideUp = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(26, 127, 67, .45); }
  100% { box-shadow: 0 0 0 8px rgba(26, 127, 67, 0); }
`;

/* ---------- Popup cuộc gọi đến ---------- */

export const IncomingCard = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1100;
  width: ${p => (p.$compact ? 300 : 820)}px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 48px);
  background: ${color.surface};
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(16, 24, 40, .32), 0 0 0 1px ${color.border};
  display: flex;
  overflow: hidden;
  font-family: ${font};
  color: ${color.ink};
  animation: ${slideUp} .2s ease-out;
`;

export const IncomingLeft = styled.div`
  width: 280px;
  flex: none;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(180deg, ${color.customerBg}, ${color.surface} 70%);
  border-right: 1px solid ${color.border};

  .inc__kicker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    background: ${color.surface};
    box-shadow: 0 0 0 1px ${color.border};
    font: 600 12px/16px ${font};
    color: ${color.ink2};
  }
  .inc__kicker i {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: ${color.success};
    animation: ${pulse} 1.2s infinite;
  }
  .inc__avatar {
    margin-top: 20px;
  }
  .inc__name {
    margin-top: 12px;
    font: 700 20px/26px ${font};
  }
  .inc__phone {
    font: 500 15px/20px ${font};
    color: ${color.ink2};
    font-variant-numeric: tabular-nums;
  }
  .inc__tag {
    margin-top: 8px;
  }
`;

export const IncomingActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
  padding-top: 24px;
  width: 100%;

  button {
    flex: 1;
    height: 44px;
    border: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
    font: 700 14px/1 ${font};
    cursor: pointer;
  }
  .reject {
    background: ${color.danger};
  }
  .accept {
    background: ${color.success};
  }
`;

export const IncomingRight = styled.div`
  flex: 1;
  min-width: 0;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
`;

/* ---------- Drawer trong cuộc gọi ---------- */

export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1090;
  background: rgba(16, 24, 40, .12);
`;

export const InCallPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  width: 560px;
  max-width: 100vw;
  background: ${color.surface};
  box-shadow: -16px 0 40px rgba(16, 24, 40, .18);
  display: flex;
  flex-direction: column;
  font-family: ${font};
  color: ${color.ink};
  animation: ${slideIn} .2s ease-out;
`;

export const CallBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${color.ink};
  color: #fff;

  b {
    font: 700 15px/20px ${font};
  }
  small {
    display: block;
    font: 500 12px/16px ${font};
    color: rgba(255, 255, 255, .7);
  }
  .timer {
    display: flex;
    align-items: center;
    gap: 6px;
    font: 700 15px/1 ${font};
    color: #4ADE80;
    font-variant-numeric: tabular-nums;
  }
  .timer i {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: #F87171;
  }
  .sp {
    flex: 1;
  }
`;

export const CallControl = styled.button`
  width: ${p => (p.$end ? 44 : 36)}px;
  height: 36px;
  border: 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${p => (p.$end ? 18 : 16)}px;
  cursor: pointer;
  background: ${p => {
    if (p.$end) {
      return color.danger;
    }
    return p.$on ? '#fff' : 'rgba(255, 255, 255, .12)';
  }};
  color: ${p => (p.$on && !p.$end ? color.ink : '#fff')};
`;

export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 16px;
  border-bottom: 1px solid ${color.border};

  button {
    padding: 10px 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    font: 600 13px/1 ${font};
    color: ${color.ink2};
    display: flex;
    gap: 5px;
    align-items: center;
    cursor: pointer;
  }
  button.on {
    color: ${color.primary};
    border-bottom-color: ${color.primary};
  }
  em {
    font-style: normal;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 9999px;
    background: ${color.danger};
    color: #fff;
    font: 700 10px/16px ${font};
    text-align: center;
  }
`;

export const PanelBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const NoteArea = styled.textarea`
  width: 100%;
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${color.borderStrong};
  font: 400 13px/20px ${font};
  color: ${color.ink};
  resize: vertical;
  outline: none;

  &:focus {
    border-color: ${color.primary};
  }
`;

export const PanelFooter = styled.div`
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid ${color.border};
  background: ${color.surface};

  .sp {
    flex: 1;
  }
`;

export const OrderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${color.border};
  font: 500 13px/18px ${font};

  > div {
    flex: 1;
  }
  small {
    display: block;
    color: ${color.ink3};
    font-size: 11px;
  }
`;
