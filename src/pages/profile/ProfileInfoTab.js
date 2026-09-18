import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Button, Form, Input, message, Upload } from 'antd'
import {
  DeleteOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { RequestUtils, jwtService } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import useGetMe from '@/hooks/useGetMe'
import { emitBusinessUpdated, getTokenPayload } from '@/utils/authUtils'
import {
  normalizeUploadFileName,
  resolveUploadUrl as resolveSharedUploadUrl,
} from '@/containers/PreviewModal/uploadUtils'
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

const USER_BUSINESS_INFO_API = '/auth/user-bussiness/find-info'
const USER_BUSINESS_SAVE_API = '/auth/user-bussiness/save-info'

const resolveBusinessLogo = (logo) => resolveUploadUrl(logo)

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
  return resolveSharedUploadUrl(item)
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

const normalizeCertificatePaths = (certificate) => {
  if (!certificate) return []
  if (Array.isArray(certificate)) return certificate.filter(Boolean)
  if (typeof certificate === 'string') return [certificate]
  return []
}

const mapCertificatesFromBusinessInfo = (certificate) => {
  const paths = normalizeCertificatePaths(certificate)
  if (!paths.length) return []

  return [{
    id: 'certificate-loaded',
    name: '',
    files: paths.map((path, index) => toCertificateFile(path, index)),
  }]
}

const ProfileInfoTab = () => {
  const { user: profile } = useGetMe()
  const [profileForm] = Form.useForm()
  const [logoFile, setLogoFile] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [profileSaving, setProfileSaving] = useState(false)
  const [businessInfo, setBusinessInfo] = useState(null)

  const bizId = useMemo(() => (
    profile?.bizId
    ?? profile?.biz_id
    ?? getTokenPayload()?.bizId
    ?? null
  ), [profile])

  useEffect(() => {
    if (!bizId) return undefined

    let mounted = true
    ;(async () => {
      try {
        const response = await RequestUtils.Get(USER_BUSINESS_INFO_API, { bizId })
        const info = response?.data?.id != null || response?.data?.name != null
          ? response.data
          : (response?.data?.data ?? response?.data ?? response)
        if (mounted && info && typeof info === 'object') {
          setBusinessInfo(info)
        }
      } catch (error) {
        console.warn('[Profile] fetch business info failed', error)
      }
    })()

    return () => {
      mounted = false
    }
  }, [bizId])

  const initialValues = useMemo(() => {
    if (businessInfo) {
      return {
        displayName: businessInfo.name ?? getProfileName(profile),
        email: businessInfo.email ?? getProfileEmail(profile),
        phone: businessInfo.hotline ?? businessInfo.phone ?? getProfilePhone(profile),
        address: businessInfo.address ?? '',
        code: businessInfo.code ?? '',
      }
    }

    return {
      displayName: getProfileName(profile),
      email: getProfileEmail(profile),
      phone: getProfilePhone(profile),
      address: '',
      code: '',
    }
  }, [businessInfo, profile])

  useEffect(() => {
    profileForm.setFieldsValue(initialValues)
  }, [initialValues, profileForm])

  useEffect(() => {
    if (!businessInfo) return

    if (businessInfo.logo) {
      setLogoFile(toCertificateFile(businessInfo.logo, 0))
    } else {
      setLogoFile(null)
    }

    setCertificates(mapCertificatesFromBusinessInfo(businessInfo.certificate))
  }, [businessInfo])

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
      formData.append('files', file, normalizeUploadFileName(file?.name) || file?.name)
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

  const logoUrl = logoFile?.url
    || resolveBusinessLogo(businessInfo?.logo ?? businessInfo?.logoUrl ?? businessInfo?.avatar)
    || (profile?.avatar || '')

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
      formData.append('files', file, normalizeUploadFileName(file?.name) || file?.name)
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
    if (businessInfo?.logo) {
      setLogoFile(toCertificateFile(businessInfo.logo, 0))
    } else {
      setLogoFile(null)
    }
    setCertificates(mapCertificatesFromBusinessInfo(businessInfo?.certificate))
  }

  const handleProfileSave = async () => {
    let values
    try {
      values = await profileForm.validateFields()
    } catch {
      return
    }

    try {
      setProfileSaving(true)

      const logo = logoFile
        ? (resolveUploadFilename(logoFile.response) || businessInfo?.logo || '')
        : (businessInfo?.logo ?? '')

      const certificate = certificates
        .flatMap((item) => (item.files ?? []))
        .map((file) => resolveUploadFilename(file.response ?? file))
        .filter(Boolean)

      const userBusiness = {
        ...(bizId ? { id: bizId } : {}),
        name: values.displayName ?? '',
        hotline: values.phone ?? '',
        email: values.email ?? '',
        logo,
        meta: businessInfo?.meta ?? null,
        address: values.address ?? '',
        status: businessInfo?.status ?? 1,
        code: values.code ?? businessInfo?.code ?? '',
        certificate: certificate.length ? certificate : (businessInfo?.certificate ?? null),
      }

      const response = await RequestUtils.Post(USER_BUSINESS_SAVE_API, { userBusiness })

      if (response?.errorCode && response.errorCode !== SUCCESS_CODE) {
        message.error(response?.message || 'Không lưu được thông tin hồ sơ')
        return
      }

      const saved = response?.data?.id != null || response?.data?.name != null
        ? response.data
        : (response?.data?.data ?? userBusiness)

      setBusinessInfo((current) => ({ ...(current ?? {}), ...saved }))
      if (saved.logo) {
        setLogoFile(toCertificateFile(saved.logo, 0))
      }
      setCertificates(mapCertificatesFromBusinessInfo(saved.certificate))
      message.success(response?.message || 'Đã lưu thông tin hồ sơ')

      emitBusinessUpdated({ logo: saved.logo ?? logo ?? '' })

      try {
        await jwtService?.signInWithToken?.()
      } catch (refreshError) {
        console.warn('[Profile] refresh session failed', refreshError)
      }
    } catch (error) {
      message.error(error?.message || 'Không lưu được thông tin hồ sơ')
    } finally {
      setProfileSaving(false)
    }
  }

  return (
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
}

export default ProfileInfoTab
