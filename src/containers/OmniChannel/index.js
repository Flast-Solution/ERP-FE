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
import { useOmniStore, CHANNEL_TYPE_TO_ERP_SOURCE  } from '@/store/omniStore'
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
    attachLead,
    linkCustomer,
    changeStatus,
  } = useOmniInbox()

  const activeId = useOmniStore((s) => s.activeId)
  const [contextOpen, setContextOpen] = useState(false)

  /* Mở lại hội thoại từ link được chia sẻ (?c=1042) */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('c')
    if (id) {
      openConversation(Number(id))
    }
  }, [openConversation])

  /* Form tạo lead nhiều trường -> drawer (HASH_MODAL).*/
  const handleCreateLead = useCallback(() => {
    const context = useOmniStore.getState().context[activeId];
    if (!context) {
      return
    }

    const { identity } = context
    const record = {
      conversationId: activeId,
      customerName: identity.displayName,
      source: CHANNEL_TYPE_TO_ERP_SOURCE[identity.channelType] ?? null,
      /* Chiến dịch quảng cáo khách click vào, nếu bắt được ở tin đầu */
      defaultNote: identity.referralLabel
        ? `Vào từ quảng cáo: ${identity.referralLabel}`
        : undefined,
    }

    InAppEvent.emit(HASH_MODAL, {
      hash: 'lead.edit',
      title: 'Tạo lead từ hội thoại đa kênh',
      data: {
        record,
        onSubmit: ({ id }) => attachLead(id)
      }
    })
  }, [activeId, attachLead])

  /* Tìm khách cũ — hộp thoại nhỏ, dùng popup */
  const handleFindCustomer = useCallback(() => {
    const context = useOmniStore.getState().context[activeId]
    if (!context) {
      return
    }
    InAppEvent.emit(HASH_POPUP, {
      hash: 'omni.customer.search',
      title: 'Tìm khách hàng có sẵn',
      data: {
        identityId: context.identity.id,
        displayName: context.identity.displayName,
        onLink: linkCustomer
      }
    })
  }, [activeId, linkCustomer])

  /* Tạo cơ hội cho khách đã gắn — dùng lại drawer cơ hội sẵn có của ERP */
  const handleCreateOpportunity = useCallback(() => {
    const context = useOmniStore.getState().context[activeId]
    if (!context?.customer) {
      return
    }
    /* Chuyển sang trang tạo cơ hội riêng */
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
        onCloseHandoff={() => useOmniStore.getState().clearHandoffNotice()}
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
};

export default OmniChannel;
