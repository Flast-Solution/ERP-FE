import styled from 'styled-components'
import { t } from '@/css/landing'

export const Panel = styled.aside`
  flex: 0 0 ${({ $width }) => $width || '250px'};
  width: ${({ $width }) => $width || '250px'};
  min-width: 0;
  overflow: auto;
  background: ${t.surfaceCard};
  color: ${t.textPrimary};
  border-right: ${({ $right }) => ($right ? '0' : `1px solid ${t.borderDefault}`)};
  border-left: ${({ $right }) => ($right ? `1px solid ${t.borderDefault}` : '0')};
`

export const PanelHead = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 16px;
  background: ${t.surfaceCard};
  border-bottom: 1px solid ${t.borderDefault};

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 650;
  }

  p {
    margin: 5px 0 0;
    color: ${t.textTertiary};
    font-size: 11px;
    line-height: 1.4;
  }
`

export const PanelBody = styled.div`
  padding: 12px;
`

export const SectionLabel = styled.div`
  margin: 6px 4px 9px;
  color: ${t.textTertiary};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
`

export const BlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

export const BlockRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 8px 9px;
  border: 1px solid ${({ $active }) => ($active ? t.violet500 : 'transparent')};
  border-radius: 7px;
  background: ${({ $active }) => ($active ? t.brandSubtle : 'transparent')};
  color: ${({ $active }) => ($active ? t.violet300 : t.textSecondary)};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${t.surfaceHover};
    color: ${t.textPrimary};
  }
`

export const BlockIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 23px;
  height: 23px;
  flex: 0 0 23px;
  border-radius: 5px;
  background: ${t.surfaceInset};
  font-family: ${t.fontMono};
  font-size: 11px;
`

export const BlockName = styled.span`
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const Palette = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
`

export const PaletteButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  min-height: 39px;
  padding: 7px;
  border: 1px solid ${t.borderDefault};
  border-radius: 7px;
  background: ${t.surfaceHover};
  color: ${t.textSecondary};
  font-size: 11px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${t.violet500};
    color: ${t.textPrimary};
  }
`

export const Divider = styled.div`
  height: 1px;
  margin: 14px 0;
  background: ${t.borderDefault};
`

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 13px;
  color: ${t.textSecondary};
  font-size: 11px;
`

const controlStyle = `
  width: 100%;
  box-sizing: border-box;
  border: 1px solid ${t.borderDefault};
  border-radius: 7px;
  outline: none;
  background: ${t.surfaceInset};
  color: ${t.textPrimary};
  font: inherit;

  &:focus {
    border-color: ${t.violet500};
    box-shadow: 0 0 0 2px rgba(124, 92, 255, .14);
  }
`

export const TextInput = styled.input`
  ${controlStyle}
  min-height: 34px;
  padding: 7px 9px;
`

export const TextArea = styled.textarea`
  ${controlStyle}
  min-height: 74px;
  padding: 8px 9px;
  resize: vertical;
  line-height: 1.45;
`

export const SelectInput = styled.select`
  ${controlStyle}
  min-height: 34px;
  padding: 7px 9px;
`

export const ColorRow = styled.div`
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 7px;

  input[type='color'] {
    width: 36px;
    height: 34px;
    padding: 3px;
    border: 1px solid ${t.borderDefault};
    border-radius: 7px;
    background: ${t.surfaceInset};
  }
`

export const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
`

export const ActionButton = styled.button`
  min-height: 32px;
  padding: 6px 8px;
  border: 1px solid ${t.borderDefault};
  border-radius: 7px;
  background: ${t.surfaceHover};
  color: ${({ $danger }) => ($danger ? '#ff7b86' : t.textSecondary)};
  font-size: 11px;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ $danger }) => ($danger ? '#ff5f6d' : t.violet500)};
    color: ${({ $danger }) => ($danger ? '#ff9aa2' : t.textPrimary)};
  }

  &:disabled {
    opacity: .35;
    cursor: not-allowed;
  }
`

export const EmptyHint = styled.div`
  padding: 20px 8px;
  color: ${t.textTertiary};
  font-size: 12px;
  line-height: 1.55;
  text-align: center;
`

export const VersionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

export const VersionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid ${t.borderDefault};
  border-radius: 7px;
  color: ${t.textSecondary};
  font-size: 10px;

  span {
    flex: 1;
    min-width: 0;
  }

  button {
    border: 0;
    background: transparent;
    color: ${t.violet300};
    font-size: 10px;
    cursor: pointer;
  }
`

export const Repeater = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const RepeaterItem = styled.div`
  padding: 9px;
  border: 1px solid ${t.borderDefault};
  border-radius: 8px;
  background: ${t.surfaceInset};
`

export const RepeaterHead = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: ${t.textTertiary};
  font-size: 10px;

  span { flex: 1; }

  button {
    border: 0;
    background: transparent;
    color: #ff7b86;
    font-size: 10px;
    cursor: pointer;
  }
`

export const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 7px 0;
  color: ${t.textSecondary};
  font-size: 10px;
`

export const ImageControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

export const ImagePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 76px;
  padding: 8px;
  border: 1px dashed ${t.borderStrong};
  border-radius: 8px;
  background: ${t.surfaceInset};

  img {
    display: block;
    max-width: 100%;
    max-height: 64px;
    object-fit: contain;
  }

  span {
    color: ${t.textTertiary};
    font-size: 10px;
  }
`

export const ImageActions = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;

  label,
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    padding: 6px 9px;
    border: 1px solid ${t.borderDefault};
    border-radius: 7px;
    background: ${t.surfaceHover};
    color: ${t.textSecondary};
    font-size: 10px;
    cursor: pointer;
  }

  input[type='file'] {
    display: none;
  }
`

export const MultiImageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const MultiImageItem = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
  padding: 8px;
  border: 1px solid ${t.borderDefault};
  border-radius: 8px;
  background: ${t.surfaceInset};
`

export const MultiImageThumb = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 6px;
  object-fit: cover;
`

export const MultiImageFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  input {
    min-height: 29px;
  }

  button {
    align-self: flex-end;
    border: 0;
    background: transparent;
    color: #e5484d;
    font-size: 10px;
    cursor: pointer;
  }
`

export const MultiUploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px dashed ${t.violet500};
  border-radius: 8px;
  background: ${t.brandSubtle};
  color: ${t.violet700};
  font-size: 11px;
  cursor: pointer;

  input {
    display: none;
  }
`
