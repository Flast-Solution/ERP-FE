import React, { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import axios from 'axios'
import { Button, Form, Input, message, Upload } from 'antd'
import {
  AppstoreOutlined,
  BuildOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import useGetMe from '@/hooks/useGetMe'
import {
  ProfileShell,
  TabBar,
  TabItem,
  ProfileContent,
  PageTitle,
  PageDescription,
  PageHeaderDivider,
  ProfilePanel,
  ProfileSection,
  SectionAside,
  SectionTitle,
  SectionDescription,
  SectionBody,
  PasswordSectionBody,
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
  LayoutCard,
  LayoutCardHeader,
  LayoutHeaderMeta,
  LayoutBadge,
  LayoutTitle,
  LayoutApiCount,
  LayoutApiRows,
  LayoutApiRow,
  LayoutApiKeyInput,
  LayoutMethodSelect,
  LayoutApiUrlInput,
  LayoutApiIconButton,
  LayoutFileChips,
  LayoutFileChip,
  LayoutToolbar,
  LayoutBodyCard,
  LayoutBodyIcon,
  LayoutBodyTitle,
  LayoutBodyDescription,
  LayoutBodyAction,
} from './styles'

const LAYOUT_METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
]

const PROFILE_TABS = [
  { key: 'profile', label: 'Hồ sơ', icon: UserOutlined },
  { key: 'password', label: 'Mật khẩu', icon: LockOutlined },
  { key: 'layout', label: 'Bố cục trang', icon: AppstoreOutlined },
]

const getProfileName = (profile = {}) =>
  profile.fullName
  ?? profile.full_name
  ?? profile.name
  ?? profile.username
  ?? 'flast.vn'

const getProfileEmail = (profile = {}) =>
  profile.email
  ?? profile.mail
  ?? profile.username
  ?? 'admin@flast.vn'

const getProfilePhone = (profile = {}) =>
  profile.phone
  ?? profile.mobile
  ?? profile.mobilePhone
  ?? profile.mobile_phone
  ?? profile.phoneNumber
  ?? profile.phone_number
  ?? '0901 234 567'

const extractUploadItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.files)) return payload.data.files
  if (Array.isArray(payload?.data?.urls)) return payload.data.urls
  if (Array.isArray(payload?.files)) return payload.files
  if (Array.isArray(payload?.urls)) return payload.urls
  if (Array.isArray(payload?.fileNames)) return payload.fileNames
  if (Array.isArray(payload?.filenames)) return payload.filenames
  if (Array.isArray(payload?.paths)) return payload.paths
  return payload ? [payload] : []
}

const isAbsoluteUploadUrl = (value = '') => /^https?:\/\//i.test(String(value)) || String(value).startsWith('/api/')

const resolveUploadFilename = (item) => {
  if (typeof item === 'string') return item
  return item?.filename
    ?? item?.file_name
    ?? item?.fileName
    ?? item?.file_name_path
    ?? item?.path
    ?? item?.fullPath
    ?? item?.full_path
    ?? item?.url
    ?? item?.fileUrl
    ?? item?.file_url
    ?? ''
}

const resolveUploadUrl = (item) => {
  const filename = resolveUploadFilename(item)
  if (!filename) return ''
  if (isAbsoluteUploadUrl(filename)) return filename
  const baseUrl = String(axios.defaults.baseURL || '/api').replace(/\/$/, '')
  return `${baseUrl}/upload/folder/view?filename=${encodeURIComponent(filename)}`
}

const toCertificateFile = (item, index, sourceFile = {}) => {
  if (item?.uid && item?.status) return item
  const filename = resolveUploadFilename(item)
  const url = resolveUploadUrl(item)
  return {
    uid: sourceFile.uid ?? item?.id ?? filename ?? url ?? `certificate-file-${index}`,
    name: sourceFile.name ?? item?.name ?? filename?.split('/').pop() ?? `file-${index + 1}`,
    status: 'done',
    url,
    response: item,
  }
}

const ProfilePage = () => {
  const { user: profile } = useGetMe()
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState('profile')
  const [logoFile, setLogoFile] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [layoutApis, setLayoutApis] = useState([])
  const [layoutFiles, setLayoutFiles] = useState([])
  const [layoutSaving, setLayoutSaving] = useState(false)

  const initialValues = useMemo(() => ({
    displayName: getProfileName(profile),
    email: getProfileEmail(profile),
    phone: getProfilePhone(profile),
  }), [profile])

  useEffect(() => {
    profileForm.setFieldsValue(initialValues)
  }, [initialValues, profileForm])

  const handleAddCertificate = () => {
    setCertificates((items) => [
      ...items,
      {
        id: `certificate-${Date.now()}`,
        name: '',
        files: [],
      },
    ])
  }

  const handleLogoUpload = async ({ file, onSuccess, onError }) => {
    if (!String(file.type ?? '').startsWith('image/')) {
      message.error('Logo chỉ hỗ trợ file ảnh')
      onError(new Error('Logo chỉ hỗ trợ file ảnh'))
      return
    }

    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('folder', 'test')
      const response = await axios.post('/upload/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded = extractUploadItems(response.data)
      onSuccess(uploaded[0] ?? response.data)
    } catch (error) {
      message.error('Upload logo thất bại')
      onError(error)
    }
  }

  const handleLogoChange = ({ file }) => {
    if (file.status !== 'done') return
    const nextLogo = toCertificateFile(file.response ?? file, 0, file)
    setLogoFile(nextLogo)
  }

  const logoUrl = logoFile?.url ?? (profile?.avatar ? profile.avatar : '')

  const handleRemoveCertificate = (id) => {
    setCertificates((items) => items.filter((item) => item.id !== id))
  }

  const handleCertificateNameChange = (id, value) => {
    setCertificates((items) => items.map((item) =>
      item.id === id ? { ...item, name: value } : item
    ))
  }

  const handleCertificateFilesChange = (id, nextFiles = []) => {
    setCertificates((items) => items.map((item) =>
      item.id === id ? { ...item, files: nextFiles } : item
    ))
  }

  const handleCertificateUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('folder', 'test')
      const response = await axios.post('/upload/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded = extractUploadItems(response.data)
      onSuccess(uploaded.length === 1 ? uploaded[0] : uploaded)
    } catch (error) {
      message.error('Upload chứng chỉ thất bại')
      onError(error)
    }
  }

  const handleRemoveCertificateFile = (certificateId, fileUid) => {
    setCertificates((items) => items.map((item) =>
      item.id === certificateId
        ? { ...item, files: (item.files ?? []).filter((file) => file.uid !== fileUid) }
        : item
    ))
  }

  const handleProfileCancel = () => {
    profileForm.setFieldsValue(initialValues)
    setLogoFile(null)
    setCertificates([])
  }

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true)
      await profileForm.validateFields()
      message.success('Đã lưu thông tin hồ sơ')
    } catch {
      // validation errors shown by form
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordCancel = () => {
    passwordForm.resetFields()
  }

  const handlePasswordSave = async () => {
    try {
      setPasswordSaving(true)
      await passwordForm.validateFields()
      message.success('Đã cập nhật mật khẩu')
      passwordForm.resetFields()
    } catch {
      // validation errors shown by form
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleLayoutApiChange = (id, field, value) => {
    setLayoutApis((items) => items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleAddLayoutApi = () => {
    const nextIndex = layoutApis.length + 1
    setLayoutApis((items) => [
      ...items,
      {
        id: `api-${Date.now()}`,
        key: `api_${nextIndex}`,
        method: 'GET',
        url: '',
      },
    ])
  }

  const handleCopyLayoutApi = async (api) => {
    const text = `${api.method} ${api.url}`.trim()
    try {
      await navigator.clipboard.writeText(text)
      message.success('Đã sao chép')
    } catch {
      message.error('Không thể sao chép')
    }
  }

  const handleRemoveLayoutApi = (id) => {
    setLayoutApis((items) => items.filter((item) => item.id !== id))
  }

  const handleLayoutCodeUpload = async ({ file, onSuccess, onError }) => {
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('folder', 'test')
      const response = await axios.post('/upload/folder/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded = extractUploadItems(response.data)
      onSuccess(uploaded.length === 1 ? uploaded[0] : uploaded)
    } catch (error) {
      message.error('Upload code JSX thất bại')
      onError(error)
    }
  }

  const handleLayoutFilesChange = (fileList = []) => {
    const nextFiles = fileList.flatMap((file, index) => {
      if (file.status === 'done') {
        return extractUploadItems(file.response ?? file).map((item, itemIndex) =>
          toCertificateFile(item, `${index}-${itemIndex}`, file)
        )
      }
      return [file]
    })
    setLayoutFiles(nextFiles)
  }

  const handleRemoveLayoutFile = (fileUid) => {
    setLayoutFiles((items) => items.filter((file) => file.uid !== fileUid))
  }

  const handleLayoutCancel = () => {
    setLayoutApis([])
    setLayoutFiles([])
  }

  const handleLayoutSave = async () => {
    try {
      setLayoutSaving(true)
      message.success('Đã lưu cấu hình bố cục')
    } finally {
      setLayoutSaving(false)
    }
  }

  const renderTabBar = () => (
    <TabBar>
      {PROFILE_TABS.map(({ key, label, icon: Icon }) => (
        <TabItem
          key={key}
          type="button"
          $active={activeTab === key}
          onClick={() => setActiveTab(key)}
        >
          <Icon />
          <span>{label}</span>
        </TabItem>
      ))}
    </TabBar>
  )

  const renderProfileContent = () => (
    <>
      <PageTitle>Hồ sơ</PageTitle>
      <PageDescription>
        Thông tin tài khoản, logo và chứng chỉ hiển thị trên trang web của bạn.
      </PageDescription>
      <PageHeaderDivider />
      <Form
        form={profileForm}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues}
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
                  {logoUrl ? (
                    <LogoPreview src={logoUrl} alt="Logo thương hiệu" />
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
                    customRequest={handleLogoUpload}
                    onChange={handleLogoChange}
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
                  name="phone"
                  label={<FieldLabel>Số điện thoại</FieldLabel>}
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="0901 234 567" />
                </Form.Item>

                <Form.Item
                  className="full-width"
                  name="email"
                  label={<FieldLabel>Email</FieldLabel>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                  style={{ marginBottom: 4 }}
                >
                  <Input prefix={<MailOutlined />} placeholder="admin@flast.vn" />
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
              {certificates.map((certificate) => (
                <CertificateItem key={certificate.id}>
                  <Input
                    value={certificate.name}
                    placeholder="Tên chứng chỉ"
                    onChange={(event) => handleCertificateNameChange(certificate.id, event.target.value)}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveCertificate(certificate.id)}
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
                            onClick={() => handleRemoveCertificateFile(certificate.id, file.uid)}
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
                      customRequest={handleCertificateUpload}
                      onChange={({ fileList }) => {
                        const nextFiles = fileList.flatMap((file, index) => {
                          if (file.status === 'done') {
                            return extractUploadItems(file.response ?? file).map((item, itemIndex) =>
                              toCertificateFile(item, `${index}-${itemIndex}`, file)
                            )
                          }
                          return [file]
                        })
                        handleCertificateFilesChange(certificate.id, nextFiles)
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Tải tệp</Button>
                    </Upload>
                  </CertificateUploadZone>
                </CertificateItem>
              ))}

              <AddCertificateButton type="button" onClick={handleAddCertificate} style={{ marginTop: 12 }}>
                <PlusOutlined />
                <span>Thêm chứng chỉ</span>
              </AddCertificateButton>
            </SectionBody>
          </ProfileSection>
        </ProfilePanel>

        <ProfileActions>
          <ProfileActionsNote>Thay đổi sẽ áp dụng ngay sau khi lưu.</ProfileActionsNote>
          <ProfileActionsButtons>
            <Button type="text" onClick={handleProfileCancel}>
              Huỷ
            </Button>
            <Button type="primary" loading={profileSaving} onClick={handleProfileSave}>
              Hoàn thành
            </Button>
          </ProfileActionsButtons>
        </ProfileActions>
      </Form>
    </>
  )

  const renderPasswordContent = () => (
    <>
      <PageTitle>Mật khẩu</PageTitle>
      <PageDescription>
        Quản lý mật khẩu đăng nhập và bảo mật tài khoản.
      </PageDescription>
      <PageHeaderDivider />

      <Form
        form={passwordForm}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
      >
        <ProfilePanel>
          <ProfileSection>
            <SectionAside>
              <SectionTitle>Đổi mật khẩu</SectionTitle>
              <SectionDescription>
                Mật khẩu mạnh giúp bảo vệ tài khoản và các trang đã xuất bản.
              </SectionDescription>
            </SectionAside>

            <PasswordSectionBody>
              <Form.Item
                name="currentPassword"
                label={<FieldLabel>Mật khẩu hiện tại</FieldLabel>}
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={<FieldLabel>Mật khẩu mới</FieldLabel>}
                style={{ marginBottom: 4 }}
                dependencies={['currentPassword']}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu mới cần ít nhất 8 ký tự' },
                  {
                    pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: 'Mật khẩu mới cần gồm chữ và số',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value !== getFieldValue('currentPassword')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
              <FieldHelp>Ít nhất 8 ký tự, gồm chữ và số.</FieldHelp>

              <Form.Item
                name="confirmPassword"
                label={<FieldLabel>Xác nhận mật khẩu mới</FieldLabel>}
                style={{ marginTop: 22, marginBottom: 0 }}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || value === getFieldValue('newPassword')) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Xác nhận mật khẩu mới không khớp'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>
            </PasswordSectionBody>
          </ProfileSection>
        </ProfilePanel>

        <ProfileActions>
          <ProfileActionsNote>Thay đổi sẽ áp dụng ngay sau khi lưu.</ProfileActionsNote>
          <ProfileActionsButtons>
            <Button type="text" onClick={handlePasswordCancel}>
              Huỷ
            </Button>
            <Button type="primary" loading={passwordSaving} onClick={handlePasswordSave}>
              Hoàn thành
            </Button>
          </ProfileActionsButtons>
        </ProfileActions>
      </Form>
    </>
  )

  const renderLayoutContent = () => (
    <>
      <PageTitle>Bố cục trang</PageTitle>
      <PageDescription>
        Cấu hình Header và Footer dùng chung cho toàn bộ trang web.
      </PageDescription>
      <PageHeaderDivider />

      <ProfilePanel>
        <ProfileSection>
          <SectionAside>
            <SectionTitle>Header &amp; Footer</SectionTitle>
            <SectionDescription>
              Header và Footer dùng chung cho toàn site. Riêng Body được cấu hình theo từng trang trong hộp thoại cấu hình.
            </SectionDescription>
          </SectionAside>

          <SectionBody>
            <LayoutCard>
              <LayoutCardHeader>
                <LayoutHeaderMeta>
                  <LayoutBadge>#layout</LayoutBadge>
                  <LayoutTitle>Bố cục (Header + Footer)</LayoutTitle>
                </LayoutHeaderMeta>
                <LayoutApiCount>{layoutApis.length} API</LayoutApiCount>
              </LayoutCardHeader>

              <LayoutApiRows>
                {layoutApis.map((api) => (
                  <LayoutApiRow key={api.id}>
                    <LayoutApiKeyInput
                      value={api.key}
                      onChange={(event) => handleLayoutApiChange(api.id, 'key', event.target.value)}
                    />
                    <LayoutMethodSelect
                      value={api.method}
                      onChange={(event) => handleLayoutApiChange(api.id, 'method', event.target.value)}
                    >
                      {LAYOUT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </LayoutMethodSelect>
                    <LayoutApiUrlInput
                      value={api.url}
                      onChange={(event) => handleLayoutApiChange(api.id, 'url', event.target.value)}
                    />
                    <LayoutApiIconButton
                      type="button"
                      aria-label={`Sao chép ${api.key}`}
                      onClick={() => handleCopyLayoutApi(api)}
                    >
                      <CopyOutlined />
                    </LayoutApiIconButton>
                    <LayoutApiIconButton
                      type="button"
                      aria-label={`Xoá ${api.key}`}
                      onClick={() => handleRemoveLayoutApi(api.id)}
                    >
                      <DeleteOutlined />
                    </LayoutApiIconButton>
                  </LayoutApiRow>
                ))}
              </LayoutApiRows>

              {layoutFiles.length > 0 && (
                <LayoutFileChips>
                  {layoutFiles.map((file) => (
                    <LayoutFileChip key={file.uid}>
                      <CodeOutlined />
                      <span>{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Xoá ${file.name}`}
                        onClick={() => handleRemoveLayoutFile(file.uid)}
                      >
                        ×
                      </button>
                    </LayoutFileChip>
                  ))}
                </LayoutFileChips>
              )}

              <LayoutToolbar>
                <Button icon={<PlusOutlined />} onClick={handleAddLayoutApi}>
                  Thêm API
                </Button>
                <Upload
                  multiple
                  accept=".jsx,.js,text/javascript,application/javascript"
                  showUploadList={false}
                  fileList={layoutFiles}
                  customRequest={handleLayoutCodeUpload}
                  onChange={({ fileList }) => handleLayoutFilesChange(fileList)}
                >
                  <Button icon={<CodeOutlined />}>Tải code JSX</Button>
                </Upload>
                <Button type="primary" icon={<BuildOutlined />}>Build</Button>
                <Button icon={<SearchOutlined />}>Tìm component</Button>
              </LayoutToolbar>
            </LayoutCard>
          </SectionBody>
        </ProfileSection>
      </ProfilePanel>

      <LayoutBodyCard>
        <LayoutBodyIcon>
          <AppstoreOutlined />
        </LayoutBodyIcon>
        <div>
          <LayoutBodyTitle>Phần Body cấu hình ở đâu?</LayoutBodyTitle>
          <LayoutBodyDescription>
            Body của mỗi trang (API, SEO, breadcrumb, component) được cấu hình riêng
            trong hộp thoại cấu hình tại trình quản lý trang.
          </LayoutBodyDescription>
        </div>
        <LayoutBodyAction type="button">Tới quản lý trang</LayoutBodyAction>
      </LayoutBodyCard>

      <ProfileActions>
        <ProfileActionsNote>Thay đổi sẽ áp dụng ngay sau khi lưu.</ProfileActionsNote>
        <ProfileActionsButtons>
          <Button type="text" onClick={handleLayoutCancel}>
            Huỷ
          </Button>
          <Button type="primary" loading={layoutSaving} onClick={handleLayoutSave}>
            Hoàn thành
          </Button>
        </ProfileActionsButtons>
      </ProfileActions>
    </>
  )

  return (
    <>
      <Helmet>
        <title>Hồ sơ</title>
      </Helmet>

      <ProfileShell>
        {renderTabBar()}

        <ProfileContent>
          {activeTab === 'password'
            ? renderPasswordContent()
            : activeTab === 'layout'
              ? renderLayoutContent()
              : renderProfileContent()}
        </ProfileContent>
      </ProfileShell>
    </>
  )
}

export default ProfilePage
