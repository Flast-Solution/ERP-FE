import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Dropdown } from 'antd'
import { DownOutlined, UserOutlined } from '@ant-design/icons'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'

const PAGE_SIZE = 50

const QuotationApproverSelect = ({ value, onChange, disabled = false }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(0)
  const loadingRef = useRef(false)
  const requestRef = useRef(0)

  const loadUsers = useCallback(async () => {
    if (loadingRef.current) return
    const requestId = ++requestRef.current
    const nextPage = pageRef.current + 1
    loadingRef.current = true
    setLoading(true)
    setError('')
    try {
      const response = await RequestUtils.Get('/user/list', { page: nextPage, limit: PAGE_SIZE })
      if (requestId !== requestRef.current) return
      if (Number(response?.errorCode) !== SUCCESS_CODE) {
        throw new Error(response?.message || 'Không tải được danh sách người phê duyệt')
      }
      const nextUsers = Array.isArray(response?.data) ? response.data : response?.data?.embedded ?? []
      const validUsers = nextUsers.filter(user => Number.isInteger(Number(user.id)) && Number(user.id) > 0)
      setUsers(current => [...new Map([...current, ...validUsers].map(user => [Number(user.id), user])).values()])
      pageRef.current = nextPage
      const pagination = response?.data?.page
      const total = Number(pagination?.totalElements ?? pagination?.total)
      const pageSize = Number(pagination?.pageSize) || PAGE_SIZE
      setHasMore(nextUsers.length > 0 && (Number.isFinite(total)
        ? nextPage * pageSize < total
        : nextUsers.length >= PAGE_SIZE))
    } catch (loadError) {
      if (requestId === requestRef.current) {
        setError(loadError?.message || 'Không tải được danh sách người phê duyệt')
      }
    } finally {
      if (requestId === requestRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadUsers()
    return () => {
      requestRef.current += 1
      loadingRef.current = false
    }
  }, [loadUsers])

  const userLabel = user => user.fullName || user.name || user.ssoId || user.username || `#${user.id}`
  const selectedUser = users.find(user => Number(user.id) === Number(value))
  const label = selectedUser ? userLabel(selectedUser) : value ? `Người phê duyệt #${value}` : 'Chọn người phê duyệt'

  return (
    <Dropdown
      trigger={['click']}
      disabled={disabled}
      menu={{
        items: [
          { key: 'none', label: 'Không chọn người phê duyệt' },
          { type: 'divider' },
          ...(users.length
            ? users.map(user => ({ key: String(user.id), label: userLabel(user) }))
            : [{ key: 'empty', label: loading ? 'Đang tải...' : 'Chưa có người dùng', disabled: true }]),
        ],
        selectable: true,
        selectedKeys: value == null ? ['none'] : [String(value)],
        onClick: ({ key }) => onChange(key === 'none' ? undefined : Number(key)),
        style: { maxHeight: 280, overflowY: 'auto' },
      }}
      dropdownRender={menu => (
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.12)' }}>
          {menu}
          {error ? <div role="alert" style={{ padding: '8px 12px', color: '#cf1322', maxWidth: 300 }}>{error}</div> : null}
          {hasMore || error ? (
            <Button block type="text" loading={loading} onClick={loadUsers}>
              {error ? 'Thử lại' : 'Tải thêm người dùng'}
            </Button>
          ) : null}
        </div>
      )}
    >
      <Button icon={<UserOutlined />} disabled={disabled} aria-label="Chọn người phê duyệt" title={label}>
        <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <DownOutlined />
      </Button>
    </Dropdown>
  )
}

export default QuotationApproverSelect
