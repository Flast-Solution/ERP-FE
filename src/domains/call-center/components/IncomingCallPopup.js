import { PhoneOutlined, SearchOutlined } from '@ant-design/icons';
import { useCallCenterStore } from '../store/useCallCenterStore';
import { formatPhone } from '../utils/format';
import {
  CustomerAvatar,
  CustomerHero,
  CustomerKpi,
  CustomerOpenItems,
  CustomerTimeline,
} from './CustomerSummary';
import { EmptyBox, OpenRow, SectionTitle, StatusTag } from '../styles/shared.styles';
import {
  IncomingActions,
  IncomingCard,
  IncomingLeft,
  IncomingRight,
} from '../styles/call.styles';

const HANGUP_STYLE = { transform: 'rotate(135deg)' };

/* Popup thông tin cơ bản của khách khi có cuộc gọi đến */
const IncomingCallPopup = () => {
  const call = useCallCenterStore(state => state.call);
  const answer = useCallCenterStore(state => state.answer);
  const reject = useCallCenterStore(state => state.reject);
  const { customer, isLookingUp } = call;

  return (
    <IncomingCard role="dialog" aria-label="Cuộc gọi đến">
      <IncomingLeft>
        <span className="inc__kicker"><i />Cuộc gọi đến·</span>
        <div className="inc__avatar">
          <CustomerAvatar name={customer?.name} size={72} />
        </div>
        <div className="inc__name">{customer?.name || formatPhone(call.phone)}</div>
        <div className="inc__phone">
          {customer ? formatPhone(call.phone) : 'Việt Nam · di động'}
        </div>
        {customer && (
          <div className="inc__tag">
            <StatusTag $status={customer.status}>
              {customer.status === 'customer' ? 'Khách hàng' : 'Lead'}
            </StatusTag>
          </div>
        )}
        <IncomingActions>
          <button type="button" className="reject" onClick={reject}>
            <PhoneOutlined style={HANGUP_STYLE} /> Từ chối
          </button>
          <button type="button" className="accept" onClick={answer}>
            <PhoneOutlined /> Nghe
          </button>
        </IncomingActions>
      </IncomingLeft>

      <IncomingRight>
        {isLookingUp && <EmptyBox>Đang tìm thông tin khách hàng…</EmptyBox>}
        {!isLookingUp && customer && (
          <>
            <CustomerHero customer={customer} />
            <CustomerKpi kpi={customer.kpi} />
            <CustomerOpenItems items={customer.openItems} />
            <CustomerTimeline events={customer.timeline} limit={4} />
          </>
        )}
        {!isLookingUp && !customer && (
          <>
            <EmptyBox>
              <b>Số này chưa có trong hệ thống</b>
              Chưa có khách, lead hay cuộc gọi nào. Nghe máy như bình thường;
              sau cuộc gọi bạn có thể tạo lead hoặc tạo đơn.
            </EmptyBox>
            <SectionTitle>Có thể là</SectionTitle>
            <OpenRow>
              <SearchOutlined />
              <div>
                Không tìm thấy số gần giống
                <small>Đã so với khách, lead và danh bạ nhân viên</small>
              </div>
            </OpenRow>
          </>
        )}
      </IncomingRight>
    </IncomingCard>
  );
};

export default IncomingCallPopup;
