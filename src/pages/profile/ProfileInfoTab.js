import React from 'react'
import { Alert, Button, Form, Input, message, Upload } from 'antd'
import {
  DeleteOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import useGetMe from '@/hooks/useGetMe'
import {
  extractUploadItems,
  resolveUploadUrl,
  toCertificateFile,
} from './businessProfileMappers'
import useBusinessProfile from './useBusinessProfile'
import {
  PageTitle,
  PageDescription,
  PageHeaderDivider,
  ProfilePanel,
  ProfileSection,
  SectionAside,
  SectionTitle,
  SectionDescription,
  SectionBody,
  FormGrid,
  ProfileActions,
  ProfileActionsNote,
  ProfileActionsButtons,
  CertificateUploadZone,
  LogoRow,
  LogoDrop,
  LogoPreview,
  LogoInfo,
  CardDivider,
  FieldLabel,
  FieldHelp,
  CertificateItem,
  FileList,
  FilePill,
  AddCertificateButton,
} from './styles'

const ProfileInfoTab = () => {
  const { user: profile } = useGetMe()
  const [profileForm] = Form.useForm()
  const {
    loading,
    saving,
    loadError,
    logo,
    certificates,
    reset,
    save,
  } = useBusinessProfile({ form: profileForm, profile })

  return (
    <>
      <PageTitle>Hồ sơ</PageTitle>
      <PageDescription>
        Thông tin tài khoản, logo và chứng chỉ hiển thị trên trang web của bạn.
      </PageDescription>
      <PageHeaderDivider />
      {loadError && (
        <Alert
          showIcon
          type="error"
          message="Không tải được hồ sơ doanh nghiệp"
          description="Vui lòng tải lại trang trước khi chỉnh sửa để tránh ghi đè dữ liệu hiện có."
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={profileForm}
        layout="vertical"
        requiredMark={false}
        disabled={loading || Boolean(loadError)}
      >
        <ProfilePanel>
          <ProfileSection>
            <SectionAside>
              <SectionTitle>Thông tin tài khoản</SectionTitle>
              <SectionDescription>
                Tên, thông tin liên hệ và logo thương hiệu.
              </SectionDescription>
            </SectionAside>

            <SectionBody>
              <LogoRow>
                <LogoDrop>
                  {logo.url ? (
                    <LogoPreview src={logo.url} alt="Logo thương hiệu" />
                  ) : (
                    <UploadOutlined />
                  )}
                </LogoDrop>
                <LogoInfo>
                  <strong>Logo thương hiệu</strong>
                  <span>PNG, SVG hoặc JPG — tối đa 2MB, nền trong suốt.</span>
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    customRequest={logo.upload}
                    onChange={logo.onChange}
                    beforeUpload={(file) => {
                      if (!String(file.type ?? '').startsWith('image/')) {
                        message.error('Logo chỉ hỗ trợ file ảnh')
                        return Upload.LIST_IGNORE
                      }
                      if (file.size / 1024 / 1024 > 2) {
                        message.error(`${file.name} vượt quá 2MB`)
                        return Upload.LIST_IGNORE
                      }
                      return true
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Tải logo</Button>
                  </Upload>
                </LogoInfo>
              </LogoRow>

              <CardDivider />

              <FormGrid>
                <Form.Item
                  name="displayName"
                  label={<FieldLabel>Tên hiển thị</FieldLabel>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
                >
                  <Input placeholder="Tên hiển thị" />
                </Form.Item>

                <Form.Item
                  name="code"
                  label={<FieldLabel>Mã đơn vị</FieldLabel>}
                >
                  <Input placeholder="Mã đơn vị" />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label={<FieldLabel>Số điện thoại</FieldLabel>}
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="0901 234 567" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={<FieldLabel>Email</FieldLabel>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="admin@flast.vn" />
                </Form.Item>

                <Form.Item
                  className="full-width"
                  name="address"
                  label={<FieldLabel>Địa chỉ</FieldLabel>}
                  style={{ marginBottom: 4 }}
                >
                  <Input placeholder="Địa chỉ đơn vị" />
                </Form.Item>
              </FormGrid>
              <FieldHelp>Dùng để đăng nhập và nhận thông báo.</FieldHelp>
            </SectionBody>
          </ProfileSection>

          <ProfileSection>
            <SectionAside>
              <SectionTitle>Chứng chỉ</SectionTitle>
              <SectionDescription>
                Thêm các chứng chỉ, giấy phép — mỗi mục có tên và tệp đính kèm (PDF hoặc ảnh).
              </SectionDescription>
            </SectionAside>

            <SectionBody>
              {certificates.items.map((certificate) => (
                <CertificateItem key={certificate.id}>
                  <Input
                    value={certificate.name}
                    placeholder="Tên chứng chỉ"
                    onChange={(event) => certificates.updateName(certificate.id, event.target.value)}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => certificates.remove(certificate.id)}
                  />
                  {(certificate.files ?? []).length > 0 && (
                    <FileList>
                      {(certificate.files ?? []).map((file) => (
                        <FilePill key={file.uid}>
                          <FileTextOutlined />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const url = file.url ?? resolveUploadUrl(file.response)
                              if (url) {
                                window.open(url, '_blank', 'noopener,noreferrer')
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter') return
                              const url = file.url ?? resolveUploadUrl(file.response)
                              if (url) {
                                window.open(url, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            {file.name}
                          </span>
                          <button
                            type="button"
                            aria-label={`Xoá ${file.name}`}
                            onClick={() => certificates.removeFile(certificate.id, file.uid)}
                          >
                            ×
                          </button>
                        </FilePill>
                      ))}
                    </FileList>
                  )}
                  <CertificateUploadZone>
                    <Upload
                      multiple
                      showUploadList={false}
                      fileList={certificate.files ?? []}
                      customRequest={certificates.upload}
                      onChange={({ fileList }) => {
                        const nextFiles = fileList.flatMap((file, index) => {
                          if (file.status === 'done') {
                            return extractUploadItems(file.response ?? file).map((item, itemIndex) =>
                              toCertificateFile(item, `${index}-${itemIndex}`, file)
                            )
                          }
                          return [file]
                        })
                        certificates.updateFiles(certificate.id, nextFiles)
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Tải tệp</Button>
                    </Upload>
                  </CertificateUploadZone>
                </CertificateItem>
              ))}

              <AddCertificateButton type="button" onClick={certificates.add} style={{ marginTop: 12 }}>
                <PlusOutlined />
                <span>Thêm chứng chỉ</span>
              </AddCertificateButton>
            </SectionBody>
          </ProfileSection>
        </ProfilePanel>

        <ProfileActions>
          <ProfileActionsNote>Thay đổi sẽ áp dụng ngay sau khi lưu.</ProfileActionsNote>
          <ProfileActionsButtons>
            <Button type="text" disabled={loading} onClick={reset}>
              Huỷ
            </Button>
            <Button
              type="primary"
              loading={saving}
              disabled={loading || Boolean(loadError)}
              onClick={save}
            >
              Hoàn thành
            </Button>
          </ProfileActionsButtons>
        </ProfileActions>
      </Form>
    </>
  )
}

export default ProfileInfoTab
