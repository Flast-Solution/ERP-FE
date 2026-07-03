import styled, { keyframes } from 'styled-components'
import { t } from '@/css/landing'

const spin = keyframes`to { transform: rotate(360deg); }`

export const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${t.s8};
  width: 100%;
  max-width: ${t.maxPromptW};
  box-sizing: border-box;
  padding: ${t.s10} ${t.s10} ${t.s8};
  background: ${t.surfaceOverlay};
  backdrop-filter: blur(${t.blurPanel});
  -webkit-backdrop-filter: blur(${t.blurPanel});
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.xl};
  box-shadow: ${t.xl}, ${t.edgeHighlight};
  font-family: ${t.fontSans};
  color: ${t.textPrimary};

  ${({ $docked }) => $docked && `
    position: fixed;
    left: 50%;
    bottom: ${t.overlayGutter};
    transform: translateX(-50%);
    z-index: 60;
  `}
`

export const Top = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.s6};
`

export const CtxChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${t.s3};
  height: 22px;
  padding: 0 ${t.s4} 0 ${t.s6};
  background: ${t.brandSubtle};
  color: ${t.violet300};
  font-family: ${t.fontMono};
  font-size: ${t.text2xs};
  font-weight: 600;
  border-radius: ${t.pill};
`

export const CtxClose = styled.button`
  display: inline-flex;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  opacity: .7;

  svg { width: 11px; height: 11px; display: block; }
  &:hover { opacity: 1; background: rgba(255,255,255,.12); }
`

export const Spacer = styled.span`flex: 1;`

export const FileList = styled.div`
  display: flex;
  gap: ${t.s8};
  flex-wrap: wrap;
  padding-top: ${t.s2};
`

export const FileItem = styled.div`position: relative; width: 78px;`

export const FileThumb = styled.img`
  width: 78px;
  height: 50px;
  border-radius: ${t.sm};
  object-fit: cover;
  border: 1px solid ${t.borderDefault};
`

export const FilePlaceholder = styled.span`
  width: 78px;
  height: 50px;
  border-radius: ${t.sm};
  background: ${t.surfaceInset};
  border: 1px solid ${t.borderDefault};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${t.textTertiary};
  svg { width: 18px; height: 18px; }
`

export const FileRemove = styled.button`
  position: absolute;
  top: -7px;
  right: -7px;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  border: 1px solid ${t.borderStrong};
  background: ${t.neutral800};
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${t.sm};
  transition: background ${t.fast} ${t.easeOut}, transform ${t.instant};

  svg { width: 11px; height: 11px; display: block; }
  &:hover { background: ${t.danger}; transform: scale(1.08); }
`

export const FileName = styled.span`
  display: block;
  margin-top: 5px;
  font-size: ${t.text2xs};
  color: ${t.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Row = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${t.s6};
`

export const AttachBtn = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.md};
  background: ${t.surfaceHover};
  color: ${t.textSecondary};
  cursor: pointer;
  transition: background ${t.fast} ${t.easeOut}, color ${t.fast}, border-color ${t.fast};

  svg { width: 17px; height: 17px; display: block; }
  &:hover { background: ${t.surfaceActive}; color: ${t.textPrimary}; border-color: ${t.borderStrong}; }
`

export const Textarea = styled.textarea`
  flex: 1;
  min-width: 0;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  font-family: ${t.fontSans};
  font-size: ${t.textMd};
  line-height: ${t.leadingSnug};
  color: ${t.textPrimary};
  max-height: 140px;
  padding: ${t.s4} 0;

  &::placeholder { color: ${t.textTertiary}; }
`

export const SendBtn = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: ${t.md};
  cursor: pointer;
  background: ${t.brand};
  color: ${t.onBrand};
  box-shadow: ${t.edgeHighlight};
  transition: background ${t.fast} ${t.easeOut}, transform ${t.instant} ${t.easeOut}, opacity ${t.fast};

  svg { width: 17px; height: 17px; display: block; }
  &:hover { background: ${t.brandHover}; }
  &:active { transform: translateY(.5px); }
  &:disabled { opacity: .4; cursor: not-allowed; }
`

export const SendSpinner = styled.span`
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} .6s linear infinite;
`

export const ApiList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`

export const ApiLabel = styled.span`
  font-size: ${t.text2xs};
  text-transform: uppercase;
  letter-spacing: ${t.trackingCaps};
  color: ${t.textTertiary};
  margin-right: 2px;
`

export const ApiChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  padding: 2px 9px 2px 2px;
  background: ${t.surfaceHover};
  border: 1px solid ${t.borderDefault};
  border-radius: ${t.pill};
`

export const ApiMethod = styled.span`
  font-family: ${t.fontMono};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .02em;
  padding: 2px 5px;
  border-radius: ${t.pill};
  background: ${t.surfaceInset};
  color: ${({ $color }) => $color || t.textSecondary};
`

export const ApiUrl = styled.span`
  font-family: ${t.fontMono};
  font-size: 11px;
  color: ${t.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${t.s4};
`

export const Chip = styled.button`
  border: 1px solid ${t.borderDefault};
  background: ${t.surfaceHover};
  color: ${t.textSecondary};
  font-family: ${t.fontSans};
  font-size: ${t.textXs};
  padding: ${t.s2} ${t.s6};
  border-radius: ${t.pill};
  cursor: pointer;
  transition: background ${t.fast} ${t.easeOut}, color ${t.fast}, border-color ${t.fast};

  &:hover { background: ${t.surfaceActive}; color: ${t.textPrimary}; border-color: ${t.borderStrong}; }
`

export const Foot = styled.div`
  display: flex;
  align-items: center;
  gap: ${t.s6};
  font-size: ${t.textXs};
  color: ${t.textTertiary};
`

export const Hint = styled.span`
  margin-left: auto;
  font-family: ${t.fontMono};
  font-size: 10px;
`
