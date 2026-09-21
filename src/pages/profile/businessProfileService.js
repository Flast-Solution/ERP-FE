import axios from 'axios'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import { normalizeUploadFileName } from '@/containers/PreviewModal/uploadUtils'

const USER_BUSINESS_INFO_API = '/auth/user-bussiness/find-info'
const USER_BUSINESS_SAVE_API = '/auth/user-bussiness/save-info'
const UPLOAD_API = '/erp/folder/multiple'

/** Envelope: { errorCode, message, success, data } — success khi errorCode === 200 */
const ensureSuccessfulResponse = response => {
  if (response?.errorCode === SUCCESS_CODE) return response
  throw new Error(response?.message || 'Yêu cầu hồ sơ doanh nghiệp thất bại')
}

export const getBusinessInfo = async bizId => {
  const response = await RequestUtils.Get(USER_BUSINESS_INFO_API, { bizId })
  return ensureSuccessfulResponse(response)
}

export const saveBusinessInfo = async userBusiness => {
  const response = await RequestUtils.Post(USER_BUSINESS_SAVE_API, { userBusiness })
  return ensureSuccessfulResponse(response)
}

export const uploadBusinessFiles = async (files, folder = 'test') => {
  const formData = new FormData()
  const fileList = Array.isArray(files) ? files : [files]

  fileList.filter(Boolean).forEach(file => {
    formData.append(
      'files',
      file,
      normalizeUploadFileName(file?.name) || file?.name,
    )
  })
  formData.append('folder', folder)

  const response = await axios.post(UPLOAD_API, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
