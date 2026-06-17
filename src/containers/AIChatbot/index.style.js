import styled, { css, keyframes } from 'styled-components'

/* ── Animations ── */

const fabPop = keyframes`
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
`

const panelPop = keyframes`
  from { transform: translateX(16px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`

/* ── FAB ── */

export const FABButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #18181b;
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
  animation: ${fabPop} 200ms cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    transform: translateY(-1px) scale(1.04);
    box-shadow: 0 6px 20px rgba(0,0,0,0.22);
  }
`

export const FABBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
`

/* ── Panel ── */

export const PanelWrapper = styled.div`
  position: ${({ $embedded }) => $embedded ? 'absolute' : 'fixed'};
  top: ${({ $embedded }) => $embedded ? '0' : '64px'};
  right: 0;
  z-index: 1000;
  width: ${({ $width }) => $width}px;
  min-width: 360px;
  max-width: 100vw;
  height: ${({ $embedded }) => $embedded ? '100%' : 'calc(100vh - 64px)'};
  background: #fff;
  border-left: 1px solid #e4e4e7;
  box-shadow: -8px 0 28px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  flex: none;
  overflow: visible;
  animation: ${panelPop} 180ms cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 640px) {
    top: 0;
    right: 0;
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
    height: 100vh;
  }
`

export const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  left: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 4px;
    width: 2px;
    height: 100%;
    background: transparent;
    transition: background 120ms ease;
  }

  &:hover::after {
    background: #1677ff;
  }

  ${({ $active }) => $active && css`
    &::after {
      background: #1677ff;
    }
  `}

  @media (max-width: 640px) {
    display: none;
  }
`

/* ── Panel header ── */

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  background: #fff;
`

export const HeaderBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`

export const HeaderTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
`

export const HeaderBadge = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 99px;
  padding: 1px 6px;
`

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

/* ── Context strip ── */

export const ContextStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px 8px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
`

export const ContextLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #3f3f46;
`

export const ContextMeta = styled.span`
  font-size: 11px;
  color: #71717a;
`

export const ContextDot = styled.span`
  color: #d4d4d8;
  font-size: 10px;
`
