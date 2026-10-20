import { leadTimelineDays } from '../leadEntity';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Popover, Spin, Tag } from 'antd';
import { ClockCircleOutlined, UserOutlined, FilterOutlined, FileTextOutlined, ThunderboltOutlined, ShoppingOutlined, TruckOutlined, WalletOutlined, CheckOutlined, UploadOutlined } from '@ant-design/icons';
import { RequestUtils } from '@flast-erp/core/utils';
import { createBusinessReader, businessDate, businessDateTime, moneyValue, alertDate, orderStatusLabel } from '../businessModel';
import { LEVELS, STATUSES } from '../model';

const pill = (value, tone = 'blue') => value == null || value === '' ? '—' : <span className={`business-info-pill ${tone}`}>{valueText(value)}</span>;
const valueText = value => value == null || value === '' ? '—' : typeof value === 'object' ? value.name || value.label || '—' : String(value);
function Card({ title, icon: Icon = FileTextOutlined, link, children }) {
  return <section className="business-alert-card"><div className="business-alert-card-head"><span><Icon /> {title}</span>{link}</div><div className="business-alert-card-body">{children}</div></section>;
}
function Fields({ items }) { return <dl className="business-alert-fields">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{React.isValidElement(value) ? value : valueText(value)}</dd></div>)}</dl>; }
function InteractionStrip({ read, days }) {
  const raw = read('interactions', 'timeline.events', 'activities');
  const events = Array.isArray(raw) ? raw : [];
  const complete = read('timeline.complete', 'interactionsComplete') === true;
  const end = alertDate(read('timeline.endDate')) || new Date();
  const dates = Array.from({ length: days }, (_, index) => { const date = new Date(end); date.setDate(date.getDate() - (days - 1 - index)); return date; });
  const sameDay = (left, right) => left && left.toDateString() === right.toDateString();
  return <Card title={`TƯƠNG TÁC ${days} NGÀY QUA`} icon={ClockCircleOutlined}>
    <div className="business-interactions" style={{ '--days': days }}><span />{dates.map(date => <span className="business-interaction-date" key={date.toISOString()}>{date.getDate()}/{date.getMonth() + 1}</span>)}
      {['Khách', 'Sale'].map((side, row) => <React.Fragment key={side}><strong>{side}</strong>{dates.map(date => {
        const matches = events.filter(event => sameDay(alertDate(event.at ?? event.createdAt), date) && ['customer', 'in', 'khach', 'sale', 'out', 'agent'].includes(event.side ?? event.direction ?? event.actorType) && ((row === 0) === ['customer', 'in', 'khach'].includes(event.side ?? event.direction ?? event.actorType)));
        const cell = <button type="button" className={`business-interaction-cell ${matches.length ? 'has-events' : ''}`} disabled={!matches.length} aria-label={`${side} ${businessDate(date)}: ${matches.length ? `${matches.length} tương tác` : complete ? 'Không có tương tác' : 'Chưa có dữ liệu'}`} />;
        return matches.length ? <Popover key={`${side}-${date.toISOString()}`} title={`${side} · ${businessDate(date)}`} content={<div>{matches.map((event, i) => <p key={event.id ?? i}>{valueText(event.title ?? event.type)} · {valueText(event.content ?? event.note)}</p>)}</div>}>{cell}</Popover> : <React.Fragment key={`${side}-${date.toISOString()}`}>{cell}</React.Fragment>;
      })}</React.Fragment>)}
    </div><p className="business-data-note">{complete ? (events.length ? 'Bấm vào ô có tương tác để xem chi tiết.' : 'Không ghi nhận tương tác trong khoảng thời gian này.') : 'Chưa có dữ liệu tương tác đầy đủ để kết luận khách hoặc sale không liên hệ.'}</p>
  </Card>;
}
export default function BusinessAlertDetails({ alert, scenario, onOpen }) {
  const [loaded, setLoaded] = useState({}); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const entityId = alert.entityData?.id, entityKind = alert.entityData?.kind;
  useEffect(() => {
    let active = true; setLoaded({}); setError('');
    if (!['ORDER', 'DEAL', 'QUOTE'].includes(entityKind) || entityId == null) { setLoading(false); return undefined; }
    setLoading(true);
    RequestUtils.Get('/erp/order/view-on-edit', { orderId: entityId }).then(response => {
      if (response?.success === false || (response?.errorCode != null && Number(response.errorCode) !== 200)) throw new Error(response.message || 'Không tải được thông tin đơn hàng.');
      if (active) { const data = response?.data || {}; setLoaded({ order: data.order || data, customer: data.customer }); }
    }).catch(failure => { if (active) setError(failure.message) }).finally(() => { if (active) setLoading(false) });
    return () => { active = false };
  }, [alert.id, entityId, entityKind]);
  const read = createBusinessReader(alert, loaded);
  const currency = String(read('order.currency', 'currency') || 'VND').toUpperCase();
  const open = (label, target) => <Button type="link" size="small" onClick={() => onOpen(target)}>{label} →</Button>;
  const customerName = read('customer.name', 'customer.fullName', 'lead.customerName', 'order.customerReceiverName', 'customerName') || alert.entity;
  const customerPhone = read('customer.mobile', 'customer.mobilePhone', 'lead.customerMobile', 'order.customerMobilePhone', 'customerPhone', 'phone');
  const owner = read('owner.name', 'sale.name', 'order.userCreateUsername', 'saleName') || alert.owner;
  const orderCode = read('order.code', 'orderCode') || alert.code;
  const details = read('order.details', 'order.orderDetails', 'details', 'products', 'data');
  const products = Array.isArray(details) ? details : [];
  const total = read('order.total', 'total'); const paid = read('order.paid', 'paid');
  const remaining = total != null && paid != null ? Math.max(Number(total) - Number(paid), 0) : read('remainingAmount');
  const ratio = total > 0 && paid != null ? Math.min(100, Math.max(0, Number(paid) / Number(total) * 100)) : null;
  const customerCard = <Card title={['lead', 'opportunity'].includes(scenario) ? 'KHÁCH HÀNG' : scenario === 'pod' ? 'NGƯỜI NHẬN' : 'KHÁCH & SALE'} icon={UserOutlined} link={['lead', 'opportunity'].includes(scenario) ? open(scenario === 'lead' ? 'Mở lead' : 'Hồ sơ', scenario) : null}><Fields items={[
    [scenario === 'opportunity' ? 'Người liên hệ' : scenario === 'pod' ? 'Người nhận' : ['lead'].includes(scenario) ? 'Tên khách hàng' : 'Người nhận', customerName],
    ...(scenario === 'opportunity' ? [['Công ty', read('customer.companyName', 'order.enterpriseName', 'enterpriseName')]] : []),
    ...(scenario === 'lead' ? [['Loại khách', read('customer.typeLabel', 'customerTypeLabel')], ['Số điện thoại', customerPhone], ['Nguồn', read('lead.sourceName', 'sourceName')], ['Trạng thái lead', pill(read('lead.statusName', 'statusName'), 'neutral')]] : scenario === 'opportunity' ? [['Số điện thoại', customerPhone], ['Kênh', read('sourceName', 'channelName')]] : [['Số điện thoại', customerPhone], ['Địa chỉ', read('customer.address', 'order.customerAddress', 'address')]]),
    ...(['opportunity', 'pod'].includes(scenario) ? [] : [['Sale phụ trách', owner]]),
  ]} /></Card>;
  const proof = read('triggerSummary', 'ruleData.description') || alert.triggerCondition || alert.description || 'Xem điều kiện kích hoạt cảnh báo.';
  const displayCode = alert.entityData?.code || (alert.entityData?.id != null && String(alert.code) === String(alert.entityData.id) ? '' : alert.code);
  const bannerDetail = read('triggerDetail') || [displayCode, alert.dueAt ? `Hạn xử lý ${businessDate(alert.dueAt)}` : ''].filter(Boolean).join(' · ');
  const metric = scenario === 'debt' ? moneyValue(remaining, currency) : (scenario === 'production' ? read('metricLabel', 'daysRemainingLabel') : scenario === 'pod' ? read('metricLabel', 'daysOverdueLabel', 'elapsedLabel') : read('metricLabel', 'elapsedLabel')) || '';
  return <div className={`business-alert-detail business-alert-${scenario}`}>
    <div className="business-alert-eyebrow"><Tag className={`business-severity ${alert.level}`}>{alert.level === 'critical' ? '⊗' : '⚠'} {LEVELS[alert.level]}</Tag><span>{alert.category}</span><span className="business-alert-state">ⓘ {STATUSES[alert.status] || 'Chưa xử lý'}</span></div>
    <h2>{alert.title}</h2>
    <div className={`business-alert-banner ${alert.level}`}><ThunderboltOutlined /><div><strong>{proof}</strong>{bannerDetail && <small>{bannerDetail}</small>}</div>{metric && <b>{valueText(metric)}</b>}</div>
    {loading && <Spin size="small" />}{error && <Alert type="warning" showIcon message={error} />}
    {['lead', 'opportunity'].includes(scenario) && <>{customerCard}<Card title={scenario === 'lead' ? 'NHU CẦU' : 'CƠ HỘI & SALE'} icon={FilterOutlined} link={scenario === 'opportunity' ? open('Mở cơ hội', 'opportunity') : null}><Fields items={[
      ...(scenario === 'opportunity' ? [['Trạng thái', read('opportunity.statusName', 'order.statusName', 'statusName')], ['Ngày lên cơ hội', businessDate(read('order.opportunityAt', 'opportunityAt'))]] : []),
      ['Sản phẩm quan tâm', pill(read('productNames')?.join?.(', ') || products.map(item => item.productName).filter(Boolean).join(', ') || read('productName'))],
      ['Số lượng dự kiến', read('expectedQuantity', 'quantity')], ['Mức độ quan tâm', pill(read('interestLabel', 'interestLevel'), scenario === 'lead' ? 'blue' : 'gold')], ['Lịch hẹn', businessDateTime(read('appointmentAt', 'nextContactAt'))], ['Liên hệ gần nhất', businessDateTime(read('lastContactedAt', 'lastInteractionAt', 'lastActivityAt'))], ...(scenario === 'opportunity' ? [['Sale phụ trách', owner]] : []),
    ]} /></Card><InteractionStrip read={read} days={scenario === 'lead' ? leadTimelineDays(alert) : 7} /></>}
    {scenario === 'unplanned' && <Card title="TIẾN ĐỘ" icon={ClockCircleOutlined}><div className="business-order-progress"><div><i className="done"><CheckOutlined /></i><strong>Tạo đơn</strong><small>{businessDate(read('order.createdAt', 'orderCreatedAt'))}</small></div><span className="pending-line" /><div><i className="waiting"><ShoppingOutlined /></i><strong>Lệnh sản xuất</strong><small>{read('productionCount') > 0 ? 'Còn dòng chưa lập lệnh' : 'Chưa có dữ liệu lệnh'}</small></div><span /><div><i><TruckOutlined /></i><strong>Giao hàng</strong><small>—</small></div></div></Card>}
    {scenario === 'debt' && <Card title={`THANH TOÁN · ${orderCode}`} icon={WalletOutlined} link={open('Mở đơn', 'order')}><div className="business-payment">{[['Giảm giá', read('order.priceOff', 'priceOff')], ['Phí vận chuyển', read('order.shippingCost', 'shippingCost')], ['Tổng tiền', total], ['Đã thu', paid]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{moneyValue(value, currency)}</strong></div>)}<div className="business-payment-balance"><strong>Còn phải thu</strong><b>{moneyValue(remaining, currency)}</b></div>{ratio != null && <div className="business-payment-track" role="progressbar" aria-label="Tỷ lệ đã thu" aria-valuenow={Math.round(ratio)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${ratio}%` }} /></div>}</div></Card>}
    {scenario === 'production' && <><Card title="THỜI HẠN" icon={ClockCircleOutlined}><div className="business-deadlines">{[['Ngày tạo đơn', businessDate(read('order.createdAt', 'orderCreatedAt'))], ['Dự kiến hoàn thành', businessDate(read('production.dateEnd', 'dateEnd', 'expectedCompletedAt'))], ['Thời gian còn lại', read('daysRemainingLabel', 'remainingTime')]].map(([label, value], index) => <div className={index ? 'highlight' : ''} key={label}><strong>{valueText(value)}</strong><small>{label}</small></div>)}</div></Card><Card title={`SẢN XUẤT THEO SẢN PHẨM · ${orderCode}`} icon={ShoppingOutlined} link={open('Mở đơn', 'order')}><ProductRows products={read('production.details', 'productionDetails') || products} production /></Card></>}
    {scenario === 'pod' && <Card title="LỆNH GIAO" icon={TruckOutlined} link={open('Mở lệnh giao', 'shipping')}><Fields items={[
      ['Mã lệnh giao', read('shipping.deliveryCode', 'deliveryCode') || alert.code], ['Đơn hàng', read('shipping.orderCode', 'order.code', 'orderCode')], ['Đơn vị vận chuyển', read('shipping.delivery.carrierName', 'shipping.delivery.carrier', 'carrierName')], ['Mã vận đơn', read('shipping.delivery.trackingCode', 'delivery.trackingCode', 'trackingCode')], ['Ngày tạo lệnh', businessDateTime(read('shipping.createdDate', 'shippingCreatedAt'))], ['Dự kiến giao', businessDateTime(read('shipping.delivery.scheduledAt', 'delivery.scheduledAt', 'scheduledAt'))],
      ['Thời điểm giao hàng', businessDateTime(read('shipping.outboundDate', 'outboundDate'))], ['Thời gian bổ sung POD', (read('requiredHours') ?? (read('ruleData.threshold.unit') === 'hours' ? read('ruleData.threshold.value') : null)) != null ? `${read('requiredHours') ?? read('ruleData.threshold.value')} giờ` : '—'], ['Hạn bổ sung POD', businessDateTime(alert.dueAt)], ['Biển số xe', read('shipping.delivery.vehiclePlate')], ['Tài xế', read('shipping.delivery.driverName')],
    ]} /><div className="business-pod-box"><div className="business-pod-icon"><UploadOutlined /></div><div><strong>{read('pod.url', 'proofOfDelivery.url') ? 'Đã có tài liệu POD' : Array.isArray(read('shipping.attachments')) && read('shipping.attachments').length === 0 ? 'Chưa có tệp POD' : 'Bằng chứng giao hàng'}</strong><small>{read('pod.url', 'proofOfDelivery.url') ? 'Mở lệnh giao để kiểm tra tài liệu.' : 'Ảnh giao hàng, chữ ký hoặc biên bản nhận hàng'}</small></div><Button onClick={() => onOpen('shipping')}>＋ Tải lên</Button></div></Card>}
    {scenario === 'pod' && customerCard}
    {['unplanned', 'debt'].includes(scenario) && <Card title={`ĐƠN HÀNG ${orderCode}`} icon={FileTextOutlined} link={scenario !== 'pod' ? open('Mở đơn', 'order') : null}><Fields items={[
      ['Trạng thái', orderStatusLabel(read('order.status'), read('order.statusName', 'orderStatusName'))], ['Ngày tạo', businessDate(read('order.createdAt', 'orderCreatedAt'))], ...(scenario === 'unplanned' ? [['Dịch vụ', read('order.serviceName', 'serviceName')], ['NCC', read('providerName')], ['Tổng tiền', moneyValue(total, currency)], ['Đã thu', moneyValue(paid, currency)]] : scenario === 'pod' ? [['Tổng tiền', moneyValue(total, currency)], ['Đã thu', moneyValue(paid, currency)]] : scenario === 'debt' ? [['Sản phẩm', products.map(item => item.productName).filter(Boolean).join(', ')], ['NCC', read('providerName')]] : []),
    ]} />{scenario === 'unplanned' && <ProductRows products={products} />}</Card>}
    {!['lead', 'opportunity', 'pod'].includes(scenario) && customerCard}
    {!loading && <details className="business-alert-audit"><summary>Điều kiện cảnh báo & lịch sử</summary><p>{alert.triggerCondition}</p>{alert.autoClose && <p>Tự đóng khi: {alert.autoClose}</p>}{alert.context?.map((item, index) => <p key={index}>{item.label || item.key}: {valueText(item.value)}</p>)}{alert.history?.map((item, index) => <p key={`history-${index}`}>{businessDate(item.at)} · {item.text}</p>)}</details>}
  </div>;
}
function ProductRows({ products, production = false }) {
  const rows = Array.isArray(products) ? products : [];
  return <div className="business-product-table"><div className="business-product-row heading"><span>SẢN PHẨM</span><span>{production ? 'NCC' : 'SL'}</span><span>{production ? 'TRẠNG THÁI' : 'NCC'}</span></div>{rows.length ? rows.map((item, index) => <div className="business-product-row" key={item.id ?? index}><div><strong>{item.productName || item.name || '—'}</strong><small>{item.code || `Dòng ${index + 1}`}{item.skuId != null ? ` · SKU ${item.skuId}` : ''}</small></div><span>{production ? valueText(item.providerName) : valueText(item.quantity)}</span><span>{production ? <Tag>{item.statusName || 'Chưa có dữ liệu'}</Tag> : valueText(item.providerName)}</span></div>) : <p className="business-data-note">Chưa có dữ liệu sản phẩm.</p>}</div>;
}
