/**************************************************************************/
/*  @/containers/OmniChannel/DuplicateCustomerPopup.js                    */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Mở qua HASH_POPUP với hash 'omni.customer.duplicated'.                 */
/* Popup spread thẳng params.data thành props.                            */
/**************************************************************************/

import { useState } from 'react'
import { Alert, Button, Space, Tag } from 'antd'
import { ShopOutlined, UserOutlined } from '@ant-design/icons'
import styled from 'styled-components'

const PickList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;

  .pick {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;

    &:hover {
      border-color: #1677ff;
      background: #f0f7ff;
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

const DuplicateCustomerPopup = ({ mobile, duplicated = [], onPick, onCreateNew, closeModal }) => {
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
      closeModal()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Alert
        type="warning"
        showIcon
        message={`Số ${mobile} đã thuộc về khách hàng có sẵn`}
        description="Gắn hội thoại vào khách cũ để giữ chung lịch sử đơn hàng và công nợ. Chỉ tạo mới khi chắc chắn là người khác."
      />

      <PickList>
        {duplicated.map((customer) => (
          <div key={customer.id} className="pick" onClick={() => !busy && run(() => onPick(customer.id))}>
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
      </PickList>

      <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
        <Button onClick={closeModal} disabled={busy}>
          Quay lại sửa
        </Button>
        <Button danger loading={busy} onClick={() => run(onCreateNew)}>
          Vẫn tạo khách mới
        </Button>
      </Space>
    </div>
  )
}

export default DuplicateCustomerPopup