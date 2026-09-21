import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { jwtService } from '@flast-erp/core/utils'
import { emitBusinessUpdated } from '@/utils/authUtils'
import {
  buildBusinessInfoPayload,
  extractUploadItems,
  mapBusinessInfoToForm,
  mapCertificatesFromBusinessInfo,
  resolveUploadUrl,
  toCertificateFile,
  unwrapBusinessInfo,
} from './businessProfileMappers'
import {
  getBusinessInfo,
  saveBusinessInfo,
  uploadBusinessFiles,
} from './businessProfileService'

const createCertificateId = () => (
  window.crypto?.randomUUID?.() ?? `certificate-${Date.now()}`
)

const useBusinessProfile = ({ form, profile }) => {
  const [businessInfo, setBusinessInfo] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const bizId = profile?.bizId ?? null

  const formValues = useMemo(
    () => mapBusinessInfoToForm(businessInfo),
    [businessInfo],
  )

  const applyBusinessInfo = useCallback(info => {
    setBusinessInfo(info)
    setLogoFile(info?.logo ? toCertificateFile(info.logo, 0) : null)
    setCertificates(mapCertificatesFromBusinessInfo(info?.certificate))
  }, [])

  useEffect(() => {
    if (!bizId) {
      form.setFieldsValue(mapBusinessInfoToForm())
      return undefined
    }

    let mounted = true
    setLoading(true)
    setLoadError(null)

    getBusinessInfo(bizId)
      .then(response => {
        const info = unwrapBusinessInfo(response)
        if (!mounted) return
        if (!info) {
          throw new Error('Dữ liệu hồ sơ doanh nghiệp không hợp lệ')
        }
        applyBusinessInfo(info)
        form.setFieldsValue(mapBusinessInfoToForm(info))
      })
      .catch(error => {
        if (!mounted) return
        console.warn('[Profile] fetch business info failed', error)
        setLoadError(error)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [applyBusinessInfo, bizId, form])

  const addCertificate = useCallback(() => {
    setCertificates(items => [
      ...items,
      { id: createCertificateId(), name: '', files: [] },
    ])
  }, [])

  const removeCertificate = useCallback(id => {
    setCertificates(items => items.filter(item => item.id !== id))
  }, [])

  const updateCertificateName = useCallback((id, value) => {
    setCertificates(items => items.map(item => (
      item.id === id ? { ...item, name: value } : item
    )))
  }, [])

  const updateCertificateFiles = useCallback((id, files = []) => {
    setCertificates(items => items.map(item => (
      item.id === id ? { ...item, files } : item
    )))
  }, [])

  const removeCertificateFile = useCallback((certificateId, fileUid) => {
    setCertificates(items => items.map(item => (
      item.id === certificateId
        ? { ...item, files: (item.files ?? []).filter(file => file.uid !== fileUid) }
        : item
    )))
  }, [])

  const uploadFile = useCallback(async ({ file, onSuccess, onError }, errorMessage) => {
    try {
      const payload = await uploadBusinessFiles(file)
      const uploaded = extractUploadItems(payload)
      onSuccess(uploaded.length === 1 ? uploaded[0] : uploaded)
    } catch (error) {
      message.error(errorMessage)
      onError(error)
    }
  }, [])

  const uploadLogo = useCallback(async request => {
    if (!String(request.file?.type ?? '').startsWith('image/')) {
      const error = new Error('Logo chỉ hỗ trợ file ảnh')
      message.error(error.message)
      request.onError(error)
      return
    }
    await uploadFile(request, 'Upload logo thất bại')
  }, [uploadFile])

  const uploadCertificate = useCallback(
    request => uploadFile(request, 'Upload chứng chỉ thất bại'),
    [uploadFile],
  )

  const changeLogo = useCallback(({ file }) => {
    if (file.status !== 'done') return
    const uploaded = extractUploadItems(file.response ?? file)
    setLogoFile(toCertificateFile(uploaded[0] ?? file, 0, file))
  }, [])

  const reset = useCallback(() => {
    form.setFieldsValue(formValues)
    setLogoFile(businessInfo?.logo ? toCertificateFile(businessInfo.logo, 0) : null)
    setCertificates(mapCertificatesFromBusinessInfo(businessInfo?.certificate))
  }, [businessInfo, form, formValues])

  const save = useCallback(async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    setSaving(true)
    try {
      const userBusiness = buildBusinessInfoPayload({
        bizId,
        businessInfo,
        certificates,
        logoFile,
        values,
      })
      const response = await saveBusinessInfo(userBusiness)
      const saved = unwrapBusinessInfo(response) ?? userBusiness
      const nextBusinessInfo = { ...(businessInfo ?? {}), ...userBusiness, ...saved }

      applyBusinessInfo(nextBusinessInfo)
      form.setFieldsValue(mapBusinessInfoToForm(nextBusinessInfo))
      message.success(response?.message || 'Đã lưu thông tin hồ sơ')
      emitBusinessUpdated({ logo: nextBusinessInfo.logo ?? '' })

      try {
        await jwtService?.signInWithToken?.()
      } catch (refreshError) {
        console.warn('[Profile] refresh session failed', refreshError)
      }
    } catch (error) {
      message.error(error?.message || 'Không lưu được thông tin hồ sơ')
    } finally {
      setSaving(false)
    }
  }, [applyBusinessInfo, bizId, businessInfo, certificates, form, logoFile])

  const logoUrl = logoFile?.url
    || resolveUploadUrl(businessInfo?.logo)
    || ''

  return {
    loading,
    saving,
    loadError,
    logo: {
      url: logoUrl,
      upload: uploadLogo,
      onChange: changeLogo,
    },
    certificates: {
      items: certificates,
      add: addCertificate,
      remove: removeCertificate,
      updateName: updateCertificateName,
      updateFiles: updateCertificateFiles,
      removeFile: removeCertificateFile,
      upload: uploadCertificate,
    },
    reset,
    save,
  }
}

export default useBusinessProfile
