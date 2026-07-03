import styled from 'styled-components'
import { t } from '@/css/landing'

export const Wrap = styled.div`
  position: relative;
  display: block;
`

export const Overlay = styled.span`
  position: absolute;
  inset: -2px;
  border-radius: ${t.lg};
  border: 2px solid ${t.highlightBorder};
  background: ${t.highlightFill};
  pointer-events: none;
  opacity: 0;
  transition: opacity ${t.fast} ${t.easeOut};

  ${Wrap}:hover & { opacity: 1; }
  ${Wrap}.is-active & { opacity: 1; }
  ${Wrap}.is-selected & { opacity: 1; box-shadow: 0 0 0 4px ${t.highlightGlow}; }
  ${Wrap}.is-disabled & { display: none; }
`

export const Tag = styled.span`
  position: absolute;
  top: -11px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  padding: 0 7px;
  background: ${t.highlightLabel};
  color: #fff;
  font-family: ${t.fontMono};
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  border-radius: ${t.pill};
  white-space: nowrap;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity ${t.fast} ${t.easeOut}, transform ${t.fast} ${t.easeOut};

  ${Wrap}:hover & { opacity: 1; transform: translateY(0); }
  ${Wrap}.is-active & { opacity: 1; transform: translateY(0); }
  ${Wrap}.is-selected & { opacity: 1; transform: translateY(0); }
  ${Wrap}.is-disabled & { display: none; }
`

export const TriggerSlot = styled.span`
  position: absolute;
  top: -15px;
  right: -15px;
  opacity: 0;
  transform: scale(.8);
  transition: opacity ${t.fast} ${t.easeSnap}, transform ${t.fast} ${t.easeSnap};

  ${Wrap}:hover & { opacity: 1; transform: scale(1); }
  ${Wrap}.is-active & { opacity: 1; transform: scale(1); }
  ${Wrap}.is-disabled & { display: none; }
`
