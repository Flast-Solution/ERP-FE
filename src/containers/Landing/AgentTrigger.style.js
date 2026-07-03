import styled, { keyframes } from 'styled-components'
import { t } from '@/css/landing'

const ring = keyframes`
  0%   { opacity: .6; transform: scale(1); }
  100% { opacity: 0;  transform: scale(1.7); }
`

export const TriggerBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size === 'sm' ? '24px' : $size === 'lg' ? '38px' : '30px'};
  height: ${({ $size }) => $size === 'sm' ? '24px' : $size === 'lg' ? '38px' : '30px'};
  padding: 0;
  box-sizing: border-box;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: ${t.brand};
  color: ${t.onBrand};
  box-shadow: ${t.glowAgent};
  transition: transform ${t.fast} ${t.easeSnap}, background ${t.fast} ${t.easeOut};

  svg {
    width: ${({ $size }) => $size === 'sm' ? '13px' : $size === 'lg' ? '20px' : '16px'};
    height: ${({ $size }) => $size === 'sm' ? '13px' : $size === 'lg' ? '20px' : '16px'};
    display: block;
  }

  &:hover { background: ${t.brandHover}; transform: scale(1.08); }
  &:active { transform: scale(.96); }
  &:focus-visible { outline: none; box-shadow: ${t.glowAgent}, ${t.ringFocus}; }
`

export const TriggerWrap = styled.span`
  position: relative;
  display: inline-flex;
`

export const TriggerRing = styled.span`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid ${t.brand};
  animation: ${ring} 1.6s ${t.easeOut} infinite;
  pointer-events: none;
`
