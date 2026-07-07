import React, { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Button, Result, Tag } from 'antd'
import { BreadcrumbCustom, RestList } from '@flast-erp/core/components'
import { useGetList } from '@flast-erp/core/hooks'
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_MODAL } from '@/configs'
import useGetMe from '@/hooks/useGetMe'
import { isSuperAdmin } from '@/utils/authUtils'
import {
  BUSINESS_UNIT_API,
  normalizeBusinessUnit,
} from '@/containers/BusinessUnit/utils'
import BusinessUnitsFilter from './Filter'

const BusinessUnitsPage = () => {
  const { user } = useGetMe()
  const canManageBusinessUnits = isSuperAdmin(user)
  const [title] = useState('Đơn vị sử dụng hệ thống')

  const beforeSubmitFilter = useCallback((values = {}) => {
    const nextValues = Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )

    if (nextValues.page && nextValues.limit) {
      nextValues.offset = String((Number(nextValues.page) - 1) * Number(nextValues.limit))
    } else if (nextValues.offset != null) {
      nextValues.offset = String(nextValues.offset)
    }

    return nextValues
  }, [])

  const onData = useCallback((values) => {
    const items = Array.isArray(values)
      ? values
      : values?.embedded ?? values?.items ?? values?.content ?? values?.records ?? values?.data ?? []

    const normalized = items.map(normalizeBusinessUnit)
    return {
      embedded: normalized,
      page    : values?.page ?? { totalElements: normalized.length },
    }
  }, [])

  const onCreate = useCallback(() => {
    InAppEvent.emit(HASH_MODAL, {
      hash : '#draw/businessUnit.edit',
      title: 'Thêm đơn vị sử dụng',
      data : { record: { status: 1, users: [] } },
    })
  }, [])

  const onEdit = useCallback((record) => {
    InAppEvent.emit(HASH_MODAL, {
      hash : '#draw/businessUnit.edit',
      title: `Chi tiết đơn vị: ${record?.name || record?.code || ''}`,
      data : { record: normalizeBusinessUnit(record) },
    })
  }, [])

  const columns = [
    {
      title    : 'Tên đơn vị',
      dataIndex: 'name',
      width    : 220,
      ellipsis : true,
      render   : (value, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{value || '—'}</div>
          {record.code ? <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.code}</div> : null}
        </div>
      ),
    },
    {
      title    : 'Hotline',
      dataIndex: 'hotline',
      width    : 140,
      render   : value => value || '—',
    },
    {
      title    : 'Email',
      dataIndex: 'email',
      width    : 200,
      ellipsis : true,
      render   : value => value || '—',
    },
    {
      title    : 'Địa chỉ',
      dataIndex: 'address',
      width    : 240,
      ellipsis : true,
      render   : value => value || '—',
    },
    {
      title : 'Số tài khoản',
      key   : 'userCount',
      width : 120,
      render: (_, record) => {
        const count = record.users?.length ?? record.user?.length ?? 0
        return count > 0 ? count : '—'
      },
    },
    {
      title    : 'Trạng thái',
      dataIndex: 'status',
      width    : 120,
      render   : value => (
        Number(value) === 0
          ? <Tag color="red">Ngưng</Tag>
          : <Tag color="green">Hoạt động</Tag>
      ),
    },
    {
      title : 'Thao tác',
      width : 120,
      fixed : 'right',
      render: record => (
        <Button
          color="primary"
          variant="dashed"
          size="small"
          onClick={() => onEdit(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ]

  if (!canManageBusinessUnits) {
    return (
      <div>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <BreadcrumbCustom
          data={[{ title: 'Trang chủ' }, { title }]}
        />
        <Result
          status="403"
          title="Không có quyền truy cập"
          subTitle="Chỉ tài khoản ROLE_SUPER_ADMIN được phép quản lý đơn vị sử dụng hệ thống."
        />
      </div>
    )
  }

  return (
    <div className="my__content">
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title }]}
      />

      <RestList
        xScroll={1200}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<BusinessUnitsFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={BUSINESS_UNIT_API.filter}
        onData={onData}
        customClickCreate={onCreate}
        columns={columns}
      />
    </div>
  )
}

export default BusinessUnitsPage
