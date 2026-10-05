import { RequestUtils } from '@flast-erp/core/utils'

// Full templates include non-indexed tables and their column configuration.
export const fetchWorkflowTemplateFields = async ids => ({
  data: await Promise.all(ids.map(async id => {
    try {
      const response = await RequestUtils.Get('/workflow/forms/template/find-id', { id })
      if (response?.success === false) throw new Error(response.message)
      const template = response?.data ?? response
      if (!Array.isArray(template?.fields)) throw new Error('Template không có danh sách field')
      return template
    } catch (error) {
      const response = await RequestUtils.Post('/workflow/forms/template/find-template-field', [id])
      if (response?.success === false || !Array.isArray(response?.data)) throw error
      return response.data.find(item => Array.isArray(item?.fields)) ?? { id, fields: response.data }
    }
  })),
})
