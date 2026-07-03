import styled, { keyframes } from 'styled-components'
import { t } from '@/css/landing'

const spin = keyframes`to { transform: rotate(360deg); }`

const BG = {
  idle:     t.surfaceActive,
  thinking: t.brandSubtle,
  applied:  t.successSubtle,
  error:    t.dangerSubtle,
}

const COLOR = {
  idle:     t.textTertiary,
  thinking: t.violet300,
  applied:  t.green400,
  error:    t.red400,
}

export const StatusWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${t.s4};
  height: 22px;
  padding: 0 ${t.s6} 0 ${t.s5};
  box-sizing: border-box;
  font-family: ${t.fontSans};
  font-size: ${t.text2xs};
  font-weight: ${t.weightSemibold};
  letter-spacing: ${t.trackingSnug};
  border-radius: ${t.pill};
  border: 1px solid transparent;
  white-space: nowrap;
  background: ${({ $status }) => BG[$status] || BG.idle};
  color: ${({ $status }) => COLOR[$status] || COLOR.idle};
`

export const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: none;
`

export const Spinner = styled.span`
  width: 11px;
  height: 11px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} .6s linear infinite;
  flex: none;
`
