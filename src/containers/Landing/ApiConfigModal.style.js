import styled from 'styled-components'
import { t } from '@/css/landing'

export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin: -4px 0 16px;
  padding: 3px;
  background: ${t.surfaceInset};
  border: 1px solid ${t.borderSubtle};
  border-radius: ${t.md};
`

export const Tab = styled.button`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 34px;
  background: ${({ $active }) => ($active ? t.surfaceCard : 'transparent')};
  border: none;
  border-radius: ${t.sm};
  color: ${({ $active }) => ($active ? t.textPrimary : t.textTertiary)};
  box-shadow: ${({ $active }) => ($active ? t.sm : 'none')};
  font: inherit;
  font-size: ${t.textSm};
  font-weight: ${t.weightMedium};
  cursor: pointer;
  transition: 0.14s;
  &:hover { color: ${t.textSecondary}; }
`

export const TabCount = styled.span`
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) => ($active ? t.brandSubtle : t.surfaceHover)};
  border-radius: 999px;
  font-family: ${t.fontMono};
  font-size: 10px;
  font-weight: 600;
  color: ${({ $active }) => ($active ? t.violet300 : t.textSecondary)};
`

export const ApiCfg = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`

export const ApiSec = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: ${t.surfaceInset};
  border: 1px solid ${t.borderSubtle};
  border-radius: ${t.lg};
`

export const ApiSecHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

export const ApiSecLabel = styled.span`
  font-size: ${t.textSm};
  font-weight: ${t.weightMedium};
  color: ${t.textPrimary};
`

export const ApiSecCount = styled.span`
  margin-left: auto;
  font-size: ${t.textXs};
  color: ${t.textTertiary};
`

export const ApiList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const ApiRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const KeyInput = styled.input`
  width: 72px;
  flex: none;
  height: 30px;
  padding: 0 8px;
  background: ${t.surfaceCard};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.sm};
  color: ${t.textPrimary};
  font-family: ${t.fontMono};
  font-size: 11px;
  outline: none;

  &::placeholder { color: ${t.textTertiary}; }
  &:focus { border-color: ${t.brand}; box-shadow: ${t.ringFocus}; }
`

export const MethodWrap = styled.div`
  flex: none;
  position: relative;
  color: ${({ $color }) => $color};

  select {
    appearance: none;
    -webkit-appearance: none;
    height: 30px;
    padding: 0 22px 0 9px;
    background: ${t.surfaceCard};
    border: 1px solid ${t.borderDefault};
    border-radius: ${t.sm};
    font-family: ${t.fontMono};
    font-size: 11px;
    font-weight: 600;
    color: inherit;
    cursor: pointer;
    outline: none;
  }

  &::after {
    content: '';
    position: absolute;
    right: 8px;
    top: 50%;
    width: 5px;
    height: 5px;
    border-right: 1.5px solid ${t.textTertiary};
    border-bottom: 1.5px solid ${t.textTertiary};
    transform: translateY(-70%) rotate(45deg);
    pointer-events: none;
  }
`

export const UrlInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  background: ${t.surfaceCard};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.sm};
  color: ${t.textPrimary};
  font-family: ${t.fontMono};
  font-size: 12px;
  outline: none;
  transition: border-color 0.14s, box-shadow 0.14s;

  &::placeholder { color: ${t.textTertiary}; }
  &:focus { border-color: ${t.brand}; box-shadow: ${t.ringFocus}; }
`

export const EmptyNote = styled.div`
  font-size: ${t.textXs};
  color: ${t.textTertiary};
  padding: 4px 2px;
`

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

export const FileChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 4px;
`

export const FileChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 8px 0 6px;
  background: ${({ $lib }) => ($lib ? t.brandSubtle : t.surfaceHover)};
  border: 1px solid ${({ $lib }) => ($lib ? 'rgba(124,92,255,0.3)' : t.borderDefault)};
  border-radius: ${t.pill};
  font-size: ${t.textXs};
  color: ${({ $lib }) => ($lib ? t.violet300 : t.textSecondary)};
  max-width: 200px;

  span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`

export const FileChipX = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 14px;
  height: 14px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  opacity: .6;
  border-radius: 50%;

  &:hover { opacity: 1; background: rgba(255,255,255,.1); }
`

export const SearchWrap = styled.div`position: relative;`

export const Popover = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 280px;
  background: ${t.surfaceCard};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.lg};
  box-shadow: ${t.lg};
  z-index: 50;
  overflow: hidden;
`

export const PopSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid ${t.borderSubtle};

  input {
    flex: 1;
    border: none;
    background: none;
    outline: none;
    font: inherit;
    font-size: ${t.textSm};
    color: ${t.textPrimary};
    &::placeholder { color: ${t.textTertiary}; }
  }
`

export const PopList = styled.div`
  max-height: 220px;
  overflow-y: auto;
`

export const PopItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: ${t.textPrimary};
  transition: background 0.12s;

  &:hover:not(:disabled) { background: ${t.surfaceHover}; }
  &:disabled { opacity: .45; cursor: not-allowed; }
`

export const PopItemText = styled.span`
  flex: 1;
  min-width: 0;

  b { display: block; font-size: ${t.textXs}; font-weight: 600; color: ${t.textPrimary}; }
  small { display: block; font-size: 10px; color: ${t.textTertiary}; margin-top: 1px; }
`

export const PopEmpty = styled.div`
  padding: 16px;
  text-align: center;
  font-size: ${t.textXs};
  color: ${t.textTertiary};
`

export const SeoCfg = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const SeoHead = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr 32px;
  gap: 8px;
  padding: 0 2px;
`

export const SeoCol = styled.span`
  font-size: ${t.text2xs};
  text-transform: uppercase;
  letter-spacing: ${t.trackingCaps};
  color: ${t.textTertiary};
`

export const SeoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const SeoRow = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr 32px;
  gap: 8px;
  align-items: center;
`

export const SeoInput = styled.input`
  height: 32px;
  padding: 0 10px;
  background: ${t.surfaceCard};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.sm};
  color: ${t.textPrimary};
  font: inherit;
  font-size: 13px;
  outline: none;
  min-width: 0;
  transition: border-color 0.14s, box-shadow 0.14s;

  &::placeholder { color: ${t.textTertiary}; }
  &:focus { border-color: ${t.brand}; box-shadow: ${t.ringFocus}; }
`

export const SeoNameInput = styled(SeoInput)`
  font-family: ${t.fontMono};
  font-size: 12px;
`
