import styled from 'styled-components'
import { t } from '@/css/landing'

export const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: ${t.s8};
  height: 52px;
  flex: none;
  padding: 0 ${t.s12};
  background: ${t.surfaceRaised};
  border-bottom: 1px solid ${t.borderSubtle};
  box-shadow: ${t.edgeHighlight};
`

export const BarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.s6};
`

export const BarCenter = styled(BarGroup)`
  flex: 1;
  justify-content: center;
`

export const BarRight = styled(BarGroup)`
  justify-content: flex-end;
`

export const Logo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: ${t.md};
  background: ${t.brand};
  color: #fff;
  box-shadow: ${t.glowAgent};
`

export const ProjectName = styled.span`
  font-size: ${t.textSm};
  font-weight: ${t.weightSemibold};
  letter-spacing: ${t.trackingSnug};
  color: ${t.textPrimary};
`

export const Sep = styled.span`
  width: 1px;
  height: 18px;
  background: ${t.borderDefault};
  margin: 0 ${t.s2};
`

export const DeviceToggle = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px;
  background: ${t.surfaceInset};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.md};
`

export const DeviceBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border: none;
  background: none;
  color: ${t.textTertiary};
  border-radius: ${t.sm};
  cursor: pointer;
  transition: 0.14s;

  &.is-on {
    background: ${t.surfaceCard};
    color: ${t.textPrimary};
    box-shadow: ${t.sm};
  }
`

export const CfgWrap = styled.span`
  position: relative;
  display: inline-flex;
`

export const CfgCount = styled.span`
  position: absolute;
  top: -3px;
  right: -4px;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${t.brand};
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
  border: 2px solid ${t.surfaceRaised};
`

export const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${t.violet700};
  color: #fff;
  font-size: ${t.textXs};
  font-weight: 600;
  margin-left: ${t.s2};
`
