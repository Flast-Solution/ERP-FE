import styled, { keyframes } from 'styled-components'
import { t } from '@/css/landing'

const toastIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -6px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

export const Stage = styled.main`
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: ${t.s16} ${t.s12} 120px;
  background:
    radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0) 0 0 / 22px 22px,
    ${t.surfaceBase};
`

export const Frame = styled.div`
  width: 100%;
  max-width: ${({ $mobile }) => ($mobile ? '400px' : '1280px')};
  align-self: flex-start;
  background: #fff;
  border-radius: ${t.lg};
  padding: ${t.s10};
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: ${t.xl};
  transition: max-width ${t.base} ${t.easeOut};
`

export const Coach = styled.div`
  position: fixed;
  left: 50%;
  bottom: ${t.overlayGutter};
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${t.s6} ${t.s12};
  background: ${t.surfaceOverlay};
  backdrop-filter: blur(${t.blurPanel});
  -webkit-backdrop-filter: blur(${t.blurPanel});
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.pill};
  font-size: ${t.textSm};
  color: ${t.textSecondary};
  box-shadow: ${t.lg};
  pointer-events: none;
`

export const CoachSpark = styled.span`
  color: ${t.violet400};
  font-size: ${t.textMd};
`

export const Toast = styled.div`
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 80;
  display: flex;
  align-items: center;
  gap: ${t.s8};
  padding: ${t.s6} ${t.s12};
  background: ${t.neutral800};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.md};
  font-size: ${t.textSm};
  font-weight: ${t.weightMedium};
  box-shadow: ${t.lg};
  animation: ${toastIn} ${t.base} ${t.easeSnap};
`
