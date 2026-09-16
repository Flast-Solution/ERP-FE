/**************************************************************************/
/*  @/containers/OmniChannel/index.js                                     */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/

import { useCallback, useEffect, useState } from 'react'
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_MODAL } from '@/configs'
import { HASH_POPUP } from '@/configs/constant'
import { useOmniStore } from '@/store/omniStore'
import { useOmniInbox } from './useOmniInbox'
import ConversationList from './ConversationList'
import ChatBox from './ChatBox'
import ContextPanel from './ContextPanel'
import { InboxWrapper } from './styles'

const OmniChannel = () => {
  const {
    loadConversations,
    applyFilter,
    reloadContext,
    openConversation,
    sendMessage,
    notifyTyping,
    createLead,
    linkCustomer,
    changeStatus,
  } = useOmniInbox()

  const activeId = useOmniStore((s) => s.activeId)
  const [contextOpen, setContextOpen] = useState(false)

  /* Mở lại hội thoại từ link được chia sẻ (?c=1042) */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('c')
    if (id) openConversation(Number(id))
  }, [openConversation])

  /* Form tạo lead nhiều trường -> drawer (HASH_MODAL).
     Popup xác nhận trùng SĐT do chính container drawer bắn ra. */
  const handleCreateLead = useCallback(() => {
    const context = useOmniStore.getState().context[activeId]
    InAppEvent.emit(HASH_MODAL, {
      hash: 'omni.lead.create',
      title: 'Tạo lead từ hội thoại',
      data: {
        conversationId: activeId,
        defaultName: context?.identity?.displayName,
        channelName: context?.identity?.channelAccountName,
        onSubmit: createLead,
      },
    })
  }, [activeId, createLead])

  /* Tìm khách cũ — hộp thoại nhỏ, dùng popup */
  const handleFindCustomer = useCallback(() => {
    const context = useOmniStore.getState().context[activeId]
    if (!context) return
    InAppEvent.emit(HASH_POPUP, {
      hash: 'omni.customer.search',
      title: 'Tìm khách hàng có sẵn',
      data: {
        identityId: context.identity.id,
        displayName: context.identity.displayName,
        onLink: linkCustomer,
      },
    })
  }, [activeId, linkCustomer])

  /* Tạo cơ hội cho khách đã gắn — dùng lại drawer cơ hội sẵn có của ERP */
  const handleCreateOpportunity = useCallback(() => {
    const context = useOmniStore.getState().context[activeId]
    if (!context?.customer) return
    InAppEvent.emit(HASH_MODAL, {
      hash: 'cohoi.add',
      title: 'Tạo cơ hội',
      data: {
        customerId: context.customer.id,
        customerName: context.customer.name,
        mobile: context.customer.mobile,
      },
    })
  }, [activeId])

  return (
    <InboxWrapper>
      <ConversationList
        mobileActive={!activeId}
        onOpen={openConversation}
        onLoadMore={loadConversations}
        onFilter={applyFilter}
        onOpenChannelSetting={() => window.location.assign('/profile?tab=omni')}
      />

      <ChatBox
        mobileActive={Boolean(activeId)}
        onSend={sendMessage}
        onTyping={notifyTyping}
        onChangeStatus={changeStatus}
        contextOpen={contextOpen}
        onToggleContext={() => setContextOpen((v) => !v)}
      />

      <ContextPanel
        open={contextOpen}
        onCreateLead={handleCreateLead}
        onFindCustomer={handleFindCustomer}
        onCreateOpportunity={handleCreateOpportunity}
        onReloadContext={reloadContext}
        onOpenSibling={openConversation}
      />
    </InboxWrapper>
  )
}

export default OmniChannel
