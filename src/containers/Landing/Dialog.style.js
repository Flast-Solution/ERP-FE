import styled, { keyframes } from 'styled-components'
import { t } from '@/css/landing'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const popIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to   { opacity: 1; transform: none; }
`

const MAX_WIDTH = { sm: '420px', md: '560px', lg: '720px', xl: '880px' }

export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${t.s16};
  background: rgba(8, 8, 10, .6);
  backdrop-filter: blur(${t.blurScrim});
  -webkit-backdrop-filter: blur(${t.blurScrim});
  animation: ${fadeIn} ${t.fast} ${t.easeOut};
`

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $size }) => MAX_WIDTH[$size] ?? MAX_WIDTH.md};
  max-height: calc(100vh - ${t.s32});
  background: ${t.surfaceOverlay};
  backdrop-filter: blur(${t.blurPanel});
  -webkit-backdrop-filter: blur(${t.blurPanel});
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.xl};
  box-shadow: ${t.xl}, ${t.edgeHighlight};
  font-family: ${t.fontSans};
  color: ${t.textPrimary};
  overflow: hidden;
  animation: ${popIn} ${t.base} ${t.easeSnap};
`

export const Head = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${t.s8};
  padding: ${t.s16} ${t.s16} ${t.s12};
  border-bottom: 1px solid ${t.borderSubtle};
`

export const IconWrap = styled.span`
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: ${t.md};
  background: ${t.brandSubtle};
  color: ${t.violet300};

  svg { width: 18px; height: 18px; }
`

export const Titles = styled.div`
  flex: 1;
  min-width: 0;
`

export const Title = styled.h2`
  margin: 0;
  font-size: ${t.textLg};
  font-weight: ${t.weightSemibold};
  letter-spacing: ${t.trackingSnug};
`

export const Subtitle = styled.p`
  margin: 3px 0 0;
  font-size: ${t.textSm};
  color: ${t.textTertiary};
  line-height: ${t.leadingSnug};
`

export const CloseBtn = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin: -4px -4px 0 0;
  border: none;
  background: transparent;
  color: ${t.textTertiary};
  border-radius: ${t.md};
  cursor: pointer;
  transition: background ${t.fast}, color ${t.fast};

  svg { width: 18px; height: 18px; }
  &:hover { background: ${t.surfaceHover}; color: ${t.textPrimary}; }
`

export const Body = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${t.s16};
  font-size: ${t.textBase};
  color: ${t.textSecondary};
  line-height: ${t.leadingNormal};
`

export const Foot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${t.s8};
  padding: ${t.s12} ${t.s16};
  border-top: 1px solid ${t.borderSubtle};
`
