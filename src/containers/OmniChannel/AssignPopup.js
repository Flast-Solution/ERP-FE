/**************************************************************************/
/*  @/containers/OmniChannel/AssignPopup.js                               */
/**************************************************************************/
/* Mở qua HASH_POPUP với hash 'omni.conversation.assign'.                 */
/* Chỉ liệt kê nhân viên CÓ QUYỀN trên kênh của hội thoại — giao cho      */
/* người không có quyền thì họ sẽ không thấy hội thoại đâu cả.            */
/**************************************************************************/

import { useState } from 'react'
import { Alert, Button, Form, Space } from 'antd'
import { FormSelectAPI } from '@flast-erp/core/components'

const AssignPopup = ({
  conversationId,
  channelAccountId,
  currentUserName,
  onAssign,
  closeModal,
}) => {

  const [ form ] = Form.useForm()
  const [ busy, setBusy ] = useState(false)

  const handleFinish = async ({ userId }) => {
    setBusy(true)
    try {
      await onAssign(conversationId, userId)
      closeModal()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {currentUserName && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Hội thoại đang do ${currentUserName} phụ trách`}
          description="Giao cho người khác sẽ lấy hội thoại khỏi danh sách."
        />
      )}

      <FormSelectAPI
        required
        name="userId"
        label="Giao cho"
        apiPath={`erp/omni/channel-account/${channelAccountId}/users`}
        valueProp="id"
        titleProp="name"
        placeholder="Chọn nhân viên"
      />

      <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button onClick={closeModal} disabled={busy}>
          Huỷ
        </Button>
        <Button type="primary" htmlType="submit" loading={busy}>
          Giao việc
        </Button>
      </Space>
    </Form>
  )
};

export default AssignPopup;