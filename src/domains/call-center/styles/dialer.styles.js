import styled from 'styled-components';
import { color, font } from './tokens';

export const PhoneTriggerWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
`;

export const PhoneTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: ${p => (p.$active ? color.primarySoft : 'transparent')};
  color: ${p => (p.$active ? color.onPrimarySoft : color.ink2)};
  font: 600 12px/1 ${font};
  cursor: pointer;

  .anticon {
    font-size: 18px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background: ${p => p.$dot};
  }
`;

export const DialerPanel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: -60px;
  z-index: 1050;
  width: 340px;
  background: ${color.surface};
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(16, 24, 40, .22), 0 0 0 1px ${color.border};
  display: flex;
  flex-direction: column;
  font-family: ${font};
  color: ${color.ink};
  line-height: normal;

  /* vùng đệm để hover từ icon xuống panel không bị đóng */
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    left: 0;
    right: 0;
    height: 10px;
  }
  &::before {
    content: '';
    position: absolute;
    top: -7px;
    right: 90px;
    width: 14px;
    height: 14px;
    background: ${color.surface};
    transform: rotate(45deg);
    box-shadow: -1px -1px 0 ${color.border};
  }
`;

export const DialerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid ${color.border};
  font: 700 15px/20px ${font};

  .sp {
    flex: 1;
  }
`;

export const ReadyToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 9999px;
  background: ${p => (p.$ready ? color.customerBg : color.surfaceSunken)};
  color: ${p => (p.$ready ? color.customerFg : color.ink2)};
  font: 600 12px/1 ${font};
  cursor: pointer;

  i {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: ${p => (p.$ready ? color.success : color.ink3)};
  }
`;

export const DialerFrom = styled.div`
  padding: 8px 14px 0;
  font: 400 12px/16px ${font};
  color: ${color.ink3};

  b {
    color: ${color.ink};
  }
`;

export const DialerInput = styled.div`
  margin: 12px 14px 0;
  height: 44px;
  border-radius: 10px;
  border: 1px solid ${color.borderStrong};
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: none;
    background: transparent;
    font: 600 20px/1 ${font};
    letter-spacing: .02em;
    font-variant-numeric: tabular-nums;
    color: ${color.ink};
  }
  button {
    border: 0;
    background: none;
    color: ${color.ink3};
    font-size: 18px;
    cursor: pointer;
  }
`;

export const DialerMatch = styled.div`
  margin: 8px 14px 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: ${color.primarySoft};
  display: flex;
  align-items: center;
  gap: 8px;
  font: 500 12px/16px ${font};
  color: ${color.onPrimarySoft};

  b {
    display: block;
    color: ${color.ink};
    font: 600 13px/18px ${font};
  }
`;

export const DialPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 14px;

  button {
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: ${color.surfaceSunken};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font: 600 18px/20px ${font};
    color: ${color.ink};
    cursor: pointer;

    &:hover {
      background: ${color.border};
    }
  }
  small {
    font: 600 8px/10px ${font};
    letter-spacing: .1em;
    color: ${color.ink3};
    min-height: 10px;
  }
`;

export const CallButton = styled.button`
  margin: 0 14px 12px;
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: ${color.success};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font: 700 14px/1 ${font};
  cursor: pointer;

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }
`;

export const RecentList = styled.div`
  border-top: 1px solid ${color.border};
  padding: 6px 0;

  h6 {
    margin: 6px 14px;
    font: 700 11px/14px ${font};
    text-transform: uppercase;
    letter-spacing: .05em;
    color: ${color.ink3};
  }
`;

export const RecentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  font: 500 13px/18px ${font};
  color: ${p => (p.$missed ? color.danger : color.ink)};

  .recent__body {
    flex: 1;
  }
  small {
    display: block;
    color: ${color.ink3};
    font-size: 11px;
  }
  button {
    border: 0;
    background: none;
    color: ${color.success};
    cursor: pointer;
    font-size: 15px;
  }
`;

export const DevLink = styled.button`
  margin: 0 14px 10px;
  border: 0;
  background: none;
  color: ${color.primary};
  font: 500 12px/1 ${font};
  cursor: pointer;
`;

export const DialerError = styled.div`
  margin: 8px 14px 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: ${color.criticalBg};
  color: ${color.criticalFg};
  font: 500 12px/16px ${font};
`;
