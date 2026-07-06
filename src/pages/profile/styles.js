import styled from 'styled-components'

export const ProfileShell = styled.div`
  min-height: calc(100vh - 64px);
  display: grid;
  grid-template-columns: 260px minmax(0, 640px);
  justify-content: center;
  gap: 32px;
  padding: 0 24px 56px;
  background: #fff;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 0 16px 40px;
  }
`

export const ProfileNav = styled.aside`
  border-right: 1px solid #f0f0f0;
  padding: 42px 32px 0 0;

  @media (max-width: 900px) {
    border-right: 0;
    border-bottom: 1px solid #f0f0f0;
    padding: 20px 0 12px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
`

export const NavGroup = styled.div`
  margin-bottom: 44px;

  @media (max-width: 900px) {
    margin-bottom: 0;
  }
`

export const NavGroupTitle = styled.div`
  margin: 0 0 10px 20px;
  font-size: 12px;
  font-weight: 700;
  color: #8b8f9f;
  text-transform: uppercase;
  letter-spacing: 0;
`

export const NavItem = styled.div`
  height: 40px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 22px;
  border-radius: 8px;
  color: ${({ $active }) => ($active ? '#8c6dfd' : '#555a66')};
  background: ${({ $active }) => ($active ? '#f0ebff' : 'transparent')};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;

  & + & {
    margin-top: 4px;
  }

  .anticon {
    font-size: 15px;
  }
`

export const ProfileContent = styled.main`
  padding-top: 4px;

  .ant-input-affix-wrapper {
    display: flex;
    align-items: center;
    padding-top: 0;
    padding-bottom: 0;
  }

  .ant-input-affix-wrapper .ant-input {
    height: auto;
    line-height: 1.4;
    background: transparent;
  }

  .ant-input,
  .ant-input-affix-wrapper {
    background: #fff;
  }

  .ant-input-disabled,
  .ant-input[disabled],
  .ant-input-affix-wrapper-disabled {
    background: #f5f5f5;
    color: rgba(0, 0, 0, 0.25);
  }

  .ant-input-prefix,
  .ant-input-suffix {
    display: inline-flex;
    align-items: center;
    color: #1f2937;
  }

  .ant-input-prefix {
    margin-inline-end: 8px;
  }
`

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  color: #111827;
`

export const PageDescription = styled.p`
  margin: 8px 0 34px;
  color: #7a7f93;
  font-size: 14px;
`

export const ProfileCard = styled.section`
  border: 1px solid #e8e8ef;
  border-radius: 10px;
  background: #fff;
  padding: 40px;
  margin-bottom: 32px;

  .ant-form-item {
    margin-bottom: 26px;
  }

  .ant-input,
  .ant-input-affix-wrapper {
    height: 36px;
    border-radius: 7px;
    background: #fff;
  }

  @media (max-width: 640px) {
    padding: 24px;
  }
`

export const PasswordCard = styled(ProfileCard)`
  margin-bottom: 28px;

  .ant-form-item {
    margin-bottom: 34px;
  }

  .ant-input-affix-wrapper {
    height: 36px;
    border-radius: 7px;
    background: #fff;
  }
`

export const PasswordActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  margin-top: 22px;

  .ant-btn-primary {
    min-width: 126px;
    height: 36px;
    border-radius: 7px;
    background: #7c5cff;
    box-shadow: 0 4px 10px rgba(124, 92, 255, 0.25);
  }
`

export const LayoutCard = styled.section`
  border: 1px solid #dfdfe7;
  border-radius: 12px;
  background: #f8f8fb;
  padding: 14px;
  margin-bottom: 34px;
`

export const LayoutCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
`

export const LayoutHeaderMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

export const LayoutBadge = styled.span`
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: #f0ebff;
  color: #b09cff;
  font-size: 12px;
  font-weight: 700;
`

export const LayoutTitle = styled.div`
  color: #111827;
  font-size: 13px;
  font-weight: 700;
`

export const LayoutApiCount = styled.div`
  color: #7a7f93;
  font-size: 12px;
  white-space: nowrap;
`

export const LayoutApiRows = styled.div`
  display: grid;
  gap: 8px;
`

export const LayoutApiRow = styled.div`
  display: grid;
  grid-template-columns: 88px 76px minmax(0, 1fr) 28px 28px;
  align-items: center;
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr 92px 32px 32px;

    > :nth-child(3) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`

export const LayoutApiKeyInput = styled.input`
  height: 32px;
  min-width: 0;
  border: 1px solid #dedee8;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #111827;
  font-size: 12px;
  outline: none;

  &:focus {
    border-color: #a99bff;
    box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.1);
  }
`

export const LayoutMethodSelect = styled.select`
  height: 32px;
  min-width: 0;
  border: 1px solid #dedee8;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #16a34a;
  font-size: 12px;
  font-weight: 700;
  outline: none;

  &:focus {
    border-color: #a99bff;
    box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.1);
  }
`

export const LayoutApiUrlInput = styled.input`
  height: 32px;
  min-width: 0;
  border: 1px solid #dedee8;
  border-radius: 6px;
  background: #fff;
  padding: 0 10px;
  color: #111827;
  font-size: 12px;
  outline: none;

  &:focus {
    border-color: #a99bff;
    box-shadow: 0 0 0 2px rgba(124, 92, 255, 0.1);
  }
`

export const LayoutApiIconButton = styled.button`
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    color: #4f46e5;
  }
`

export const LayoutFileChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
`

export const LayoutFileChip = styled.div`
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed #a99bff;
  border-radius: 999px;
  background: #f7f3ff;
  color: #b09cff;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;

  button {
    border: 0;
    background: transparent;
    color: #b09cff;
    line-height: 1;
    padding: 0;
    cursor: pointer;
  }
`

export const LayoutToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .ant-btn {
    height: 32px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 600;
  }

  .ant-btn-primary {
    background: #7c5cff;
    border-color: #7c5cff;
    box-shadow: 0 4px 10px rgba(124, 92, 255, 0.2);
  }
`

export const LayoutBodyCard = styled.section`
  min-height: 116px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 142px;
  gap: 20px;
  align-items: center;
  border: 1px solid #7c5cff;
  border-radius: 10px;
  background: #f2edff;
  padding: 28px 32px;
  margin-bottom: 32px;

  @media (max-width: 640px) {
    grid-template-columns: 40px minmax(0, 1fr);
    padding: 22px;
  }
`

export const LayoutBodyIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6d4aff;
  color: #fff;
  font-size: 17px;
`

export const LayoutBodyTitle = styled.div`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 4px;
`

export const LayoutBodyDescription = styled.div`
  max-width: 360px;
  color: #6f7488;
  font-size: 13px;
  line-height: 1.45;
`

export const LayoutBodyAction = styled.button`
  height: 36px;
  border: 1px solid #dedee8;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    border-color: #a99bff;
    color: #4f46e5;
  }

  @media (max-width: 640px) {
    grid-column: 1 / -1;
    width: 100%;
  }
`

export const LayoutActions = styled(PasswordActions)`
  margin-top: 0;
`

export const LogoRow = styled.div`
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 34px;
  align-items: center;
`

export const LogoDrop = styled.div`
  width: 78px;
  height: 78px;
  border: 1px dashed #c7c9d3;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8192;
  background: #fbfbfd;
`

export const LogoPreview = styled.img`
  width: 68px;
  height: 68px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
`

export const LogoInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  strong {
    color: #111827;
    font-size: 14px;
  }

  span {
    color: #7a7f93;
    font-size: 12px;
  }
`

export const CardDivider = styled.div`
  height: 1px;
  background: #ececf2;
  margin: 36px 0;
`

export const FieldLabel = styled.span`
  font-size: 13px;
  color: #1f2937;
`

export const FieldHelp = styled.div`
  margin-top: -2px;
  color: #8b8f9f;
  font-size: 12px;
`

export const CertificateHeader = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  margin-bottom: 32px;
`

export const CertificateIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0ebff;
  color: #8c6dfd;
`

export const CertificateTitle = styled.div`
  font-weight: 700;
  color: #111827;
  font-size: 15px;
  margin-bottom: 4px;
`

export const CertificateDescription = styled.div`
  color: #8b8f9f;
  font-size: 13px;
`

export const CertificateItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  gap: 12px;
  padding: 24px;
  border: 1px solid #dfdfe7;
  border-radius: 7px;
  background: #f8f8fb;
  margin-bottom: 24px;

  .ant-upload-wrapper {
    grid-column: 1 / -1;
  }
`

export const FileList = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const FilePill = styled.div`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dedee8;
  border-radius: 18px;
  padding: 6px 10px;
  background: #fff;
  color: #4f46e5;
  font-size: 13px;

  span[role='button'] {
    cursor: pointer;
  }

  span[role='button']:hover {
    text-decoration: underline;
  }

  button {
    border: 0;
    background: transparent;
    color: #9ca3af;
    padding: 0;
    line-height: 1;
    cursor: pointer;
  }

  button:hover {
    color: #9ca3af;
  }
`

export const AddCertificateButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px dashed #c7c9d3;
  border-radius: 7px;
  background: #fff;
  color: #5b6070;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #4f46e5;
    border-color: #a99bff;
    background: #fbfaff;
  }
`
