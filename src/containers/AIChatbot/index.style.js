import styled, { keyframes } from 'styled-components'

/* ── Animations ── */

const fabPop = keyframes`
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
`

const panelPop = keyframes`
  from { transform: translateY(8px) scale(0.96); opacity: 0; }
  to   { transform: translateY(0)   scale(1);    opacity: 1; }
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
  position: fixed;
  bottom: 80px;
  right: 24px;
  z-index: 1000;
  width: 360px;
  height: 520px;
  max-height: calc(100vh - 100px);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  animation: ${panelPop} 180ms cubic-bezier(0.22, 1, 0.36, 1);
`

/* ── Panel header ── */

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
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
