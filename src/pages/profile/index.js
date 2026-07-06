import React, { useMemo, useState } from 'react'
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
  ProfileNav,
  NavGroup,
  NavGroupTitle,
  NavItem,
  ProfileContent,
  PageTitle,
  PageDescription,
  ProfileCard,
  LogoRow,
  LogoDrop,
  LogoPreview,
  LogoInfo,
  CardDivider,
  FieldLabel,
  FieldHelp,
  CertificateHeader,
  CertificateIcon,
  CertificateTitle,
  CertificateDescription,
  CertificateItem,
  FileList,
  FilePill,
  AddCertificateButton,
  PasswordActions,
  PasswordCard,
  LayoutActions,
  LayoutApiCount,
  LayoutApiIconButton,
  LayoutApiKeyInput,
  LayoutApiRow,
  LayoutApiRows,
  LayoutApiUrlInput,
  LayoutBadge,
  LayoutBodyAction,
  LayoutBodyCard,
  LayoutBodyDescription,
  LayoutBodyIcon,
  LayoutBodyTitle,
  LayoutCard,
  LayoutCardHeader,
  LayoutFileChip,
  LayoutFileChips,
  LayoutHeaderMeta,
  LayoutMethodSelect,
  LayoutTitle,
  LayoutToolbar,
} from './styles'

const LAYOUT_METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
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
  const [activeTab, setActiveTab] = useState('profile')
  const [logoFile, setLogoFile] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [layoutApis, setLayoutApis] = useState([])
  const [layoutFiles, setLayoutFiles] = useState([])

  const initialValues = useMemo(() => ({
    displayName: getProfileName(profile),
    email: getProfileEmail(profile),
    phone: getProfilePhone(profile),
  }), [profile])

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

  const handleCopyLayoutApi = (api) => {
    setLayoutApis((items) => {
      const sourceIndex = items.findIndex((item) => item.id === api.id)
      const copiedApi = {
        ...api,
        id: `api-copy-${Date.now()}`,
      }
      if (sourceIndex < 0) return [...items, copiedApi]
      return [
        ...items.slice(0, sourceIndex + 1),
        copiedApi,
        ...items.slice(sourceIndex + 1),
      ]
    })
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

  const renderProfileContent = () => (
    <>
      <PageTitle>Hồ sơ</PageTitle>
      <PageDescription>
        Thông tin tài khoản và logo hiển thị trên trang web của bạn.
      </PageDescription>

      <ProfileCard>
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
            <span>PNG, SVG hoặc JPG - tối đa 2MB, nền trong suốt.</span>
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
              <Button size="small" icon={<UploadOutlined />}>Tải logo</Button>
            </Upload>
          </LogoInfo>
        </LogoRow>

        <CardDivider />

        <Form layout="vertical" initialValues={initialValues}>
          <Form.Item
            name="displayName"
            label={<FieldLabel>Tên hiển thị</FieldLabel>}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={<FieldLabel>Email</FieldLabel>}
            style={{ marginBottom: 4 }}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <FieldHelp>Dùng để đăng nhập và nhận thông báo.</FieldHelp>

          <Form.Item
            name="phone"
            label={<FieldLabel>Số điện thoại</FieldLabel>}
            style={{ marginTop: 26 }}
          >
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
        </Form>
      </ProfileCard>

      <ProfileCard>
        <CertificateHeader>
          <CertificateIcon>
            <FileTextOutlined />
          </CertificateIcon>
          <div>
            <CertificateTitle>Chứng chỉ</CertificateTitle>
            <CertificateDescription>
              Thêm các chứng chỉ, giấy phép - mỗi mục có tên và tệp đính kèm (PDF hoặc ảnh).
            </CertificateDescription>
          </div>
        </CertificateHeader>

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
          </CertificateItem>
        ))}

        <AddCertificateButton type="button" onClick={handleAddCertificate}>
          <PlusOutlined />
          <span>Thêm chứng chỉ</span>
        </AddCertificateButton>
      </ProfileCard>

      <PasswordActions>
        <Button type="text">Huỷ</Button>
        <Button type="primary">Cập nhật</Button>
      </PasswordActions>
    </>
  )

  const renderPasswordContent = () => (
    <>
      <PageTitle>Đổi mật khẩu</PageTitle>
      <PageDescription>
        Mật khẩu mạnh giúp bảo vệ tài khoản và các trang đã xuất bản.
      </PageDescription>

      <Form
        layout="vertical"
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
      >
        <PasswordCard>
          <Form.Item
            name="currentPassword"
            label={<FieldLabel>Mật khẩu hiện tại</FieldLabel>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password placeholder="********" />
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
            <Input.Password placeholder="********" />
          </Form.Item>
          <FieldHelp>Ít nhất 8 ký tự, gồm chữ và số.</FieldHelp>

          <Form.Item
            name="confirmPassword"
            label={<FieldLabel>Xác nhận mật khẩu mới</FieldLabel>}
            style={{ marginTop: 34, marginBottom: 0 }}
            dependencies={['currentPassword', 'newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value) {
                    return Promise.resolve()
                  }
                  if (value !== getFieldValue('newPassword')) {
                    return Promise.reject(new Error('Xác nhận mật khẩu mới không khớp'))
                  }
                  if (value === getFieldValue('currentPassword')) {
                    return Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại'))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <Input.Password placeholder="********" />
          </Form.Item>
        </PasswordCard>

        <PasswordActions>
          <Button type="text">Huỷ</Button>
          <Button type="primary" htmlType="submit">Hoàn thành</Button>
        </PasswordActions>
      </Form>
    </>
  )

  const renderLayoutContent = () => (
    <>
      <PageTitle>Bố cục trang</PageTitle>
      <PageDescription>
        Mỗi trang gồm <strong>Header</strong>, <strong>Body</strong> và <strong>Footer</strong>.
        {' '}
        Header và Footer dùng chung cho toàn site - cấu hình trong khối bên dưới.
        Riêng <strong>Body</strong> được cấu hình theo từng trang trong hộp thoại cấu hình.
      </PageDescription>

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
                <AppstoreOutlined />
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
          <Button icon={<PlusOutlined />} onClick={handleAddLayoutApi}>Thêm API</Button>
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

      <LayoutActions>
        <Button type="text">Khôi phục</Button>
        <Button type="primary">Hoàn thành</Button>
      </LayoutActions>
    </>
  )

  return (
    <>
      <Helmet>
        <title>Hồ sơ</title>
      </Helmet>

      <ProfileShell>
        <ProfileNav>
          <NavGroup>
            <NavGroupTitle>Tài khoản</NavGroupTitle>
            <NavItem
              $active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            >
              <UserOutlined />
              <span>Hồ sơ</span>
            </NavItem>
            <NavItem
              $active={activeTab === 'password'}
              onClick={() => setActiveTab('password')}
            >
              <LockOutlined />
              <span>Mật khẩu</span>
            </NavItem>
          </NavGroup>

          <NavGroup>
            <NavGroupTitle>Trang web</NavGroupTitle>
            <NavItem
              $active={activeTab === 'layout'}
              onClick={() => setActiveTab('layout')}
            >
              <AppstoreOutlined />
              <span>Bố cục trang</span>
            </NavItem>
          </NavGroup>
        </ProfileNav>

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
