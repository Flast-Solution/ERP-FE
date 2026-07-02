import React, { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { RestEditModal } from '@flast-erp/core/components'
import { RequestUtils, f5List } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'
import BusinessUnitForm from './BusinessUnitForm'
import {
  BUSINESS_UNIT_API,
  buildSavePayload,
  getResponseItems,
  mapRecordToFormValues,
  normalizeBusinessUnit,
  normalizeStatusValue,
} from './utils'

const isSuccessResponse = (response = {}) => (
  response?.success === true
  || Number(response?.errorCode) === SUCCESS_CODE
  || response?.errorCode == null
)

const BusinessUnit = ({ data, closeModal }) => {
  const [record, setRecord] = useState({ status: 1, users: [] })

  useEffect(() => {
    let mounted = true

    const loadRecord = async () => {
      const source = normalizeBusinessUnit(data?.record ?? data ?? {})
      let users = source.users ?? []
      const bizId = source.id ?? source.bizId

      if (bizId && users.length === 0) {
        try {
          const response = await RequestUtils.Get(BUSINESS_UNIT_API.listUser, { bizId })
          users = getResponseItems(response)
        } catch (_) {
          users = []
        }
      }

      if (!mounted) return

      setRecord(mapRecordToFormValues({
        ...source,
        users,
      }))
    }

    loadRecord()

    return () => {
      mounted = false
    }
  }, [data])

  const formatDefaultValues = useCallback((values = {}) => (
    mapRecordToFormValues(values)
  ), [])

  const onSubmit = useCallback(async (values) => {
    const isEdit = Boolean(values?.id ?? values?.bizId)

    if (!isEdit && (!Array.isArray(values.users) || values.users.length === 0)) {
      message.error('Vui lòng thêm ít nhất một tài khoản cho đơn vị mới.')
      return
    }

    const invalidUser = (values.users ?? []).find(user => (
      !user?.fullName
      || !user?.ssoId
      || !user?.phone
      || !user?.email
      || !user?.userProfiles?.length
      || (!isEdit && !user?.id && !user?.password)
    ))

    if (invalidUser) {
      message.error('Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu cho tài khoản mới.')
      return
    }

    const payload = buildSavePayload(values)
    const response = await RequestUtils.Post(BUSINESS_UNIT_API.saveInfo, payload)

    if (!isSuccessResponse(response)) {
      message.error(response?.message || 'Không lưu được đơn vị.')
      return
    }

    message.success(response?.message || (isEdit ? 'Đã cập nhật đơn vị.' : 'Đã tạo đơn vị.'))
    f5List(BUSINESS_UNIT_API.filter)
    closeModal?.()
  }, [closeModal])

  const isEdit = Boolean(record?.id ?? record?.bizId)

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(current => ({
        ...current,
        ...values,
        status: normalizeStatusValue(values.status ?? current.status ?? 1),
      }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
      formatDefaultValues={formatDefaultValues}
    >
      <BusinessUnitForm isEdit={isEdit} users={record.users ?? []} />
    </RestEditModal>
  )
}

export default BusinessUnit
