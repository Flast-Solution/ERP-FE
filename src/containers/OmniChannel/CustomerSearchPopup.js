/**************************************************************************/
/*  @/containers/OmniChannel/CustomerSearchPopup.js                       */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Mở qua HASH_POPUP với hash 'omni.customer.search'.                     */
/* Dùng khi khách nói "chị mua bên em hồi tháng trước" — sale tìm theo    */
/* tên hoặc SĐT rồi gắn identity vào hồ sơ có sẵn.                        */
/**************************************************************************/

import { useCallback, useState } from 'react'
import { Alert, Empty, Input, Spin, Tag } from 'antd'
import { ShopOutlined, UserOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { omniApi } from '@/services/omniService'

const Result = styled.div`
  margin-top: 14px;
  max-height: 340px;
  overflow-y: auto;

  .pick {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;

    &:hover {
      border-color: #0f7b6c;
      background: #f6fbf9;
    }
  }

  .grow {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    color: #262626;
  }

  .meta {
    font-size: 12px;
    color: #8c8c8c;
  }
`

const CustomerSearchPopup = ({ identityId, displayName, onLink, closeModal }) => {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSearch = useCallback(async (value) => {
    if (!value?.trim()) {
      setItems(null)
      return
    }
    setLoading(true)
    try {
      setItems(await omniApi.searchCustomers(value.trim()))
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePick = useCallback(
    async (customer) => {
      if (busy) return
      setBusy(true)
      try {
        await onLink(identityId, customer.id)
        closeModal()
      } finally {
        setBusy(false)
      }
    },
    [busy, identityId, onLink, closeModal]
  )

  return (
    <div>
      <Alert
        type="info"
        showIcon
        message={`Gắn "${displayName}" vào khách hàng có sẵn`}
        description="Chọn đúng người thì toàn bộ lịch sử đơn hàng và công nợ sẽ hiện ngay trong hội thoại. Gắn nhầm sẽ lộ thông tin khách này cho khách khác, nên hãy xác nhận kỹ."
      />

      <Input.Search
        autoFocus
        allowClear
        style={{ marginTop: 14 }}
        placeholder="Nhập tên hoặc số điện thoại khách"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onSearch={handleSearch}
        enterButton
      />

      <Result>
        {loading && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        )}

        {!loading &&
          items?.map((customer) => (
            <div key={customer.id} className="pick" onClick={() => handlePick(customer)}>
              {customer.companyName ? <ShopOutlined /> : <UserOutlined />}
              <div className="grow">
                <div className="name">{customer.name}</div>
                <div className="meta">
                  {customer.companyName || 'Khách lẻ'} · {customer.mobile}
                </div>
              </div>
              {customer.ownerName && <Tag bordered={false}>{customer.ownerName}</Tag>}
            </div>
          ))}

        {!loading && items?.length === 0 && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không tìm thấy khách nào khớp"
          />
        )}
      </Result>
    </div>
  )
}

export default CustomerSearchPopup
