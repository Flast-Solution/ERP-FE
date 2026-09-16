import React, { useState } from 'react'
import axios from 'axios'
import { Button, message, Upload } from 'antd'
import {
  AppstoreOutlined,
  BuildOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
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
  ProfileActions,
  ProfileActionsNote,
  ProfileActionsButtons,
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

const LayoutTab = () => {
  const [layoutApis, setLayoutApis] = useState([])
  const [layoutFiles, setLayoutFiles] = useState([])
  const [layoutSaving, setLayoutSaving] = useState(false)

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

  return (
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
}

export default LayoutTab
