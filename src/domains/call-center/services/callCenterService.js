import { RequestUtils } from '@flast-erp/core/utils';
import { SUCCESS_CODE } from '@/configs';
import { MOCK_CUSTOMERS } from '../mocks/customers';
import { sanitizePhone } from '../utils/format';

const CUSTOMER_BY_PHONE_API = '/erp/customer/find-by-phone';

const findMockCustomer = (phone) => {
  const target = sanitizePhone(phone);
  return MOCK_CUSTOMERS.find(item => sanitizePhone(item.phone) === target) || null;
};

const money = (value,currency='VND') => value == null ? '—' : `${new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(Number(value))} ${currency==='VND'?'đ':currency}`;
const displayDate = value => {
  if(value==null)return '—';
  const parsed=new Date(typeof value==='number'?value:String(value).replace(' ','T'));
  return Number.isNaN(parsed.getTime())?'—':parsed.toLocaleDateString('vi-VN');
};
export function normalizeCallCustomer(data,phone) {
  if(!data?.iCustomer)return data;
  const customer=data.iCustomer,summary=data.summary||{},lead=data.lead||{};
  const orders=Array.isArray(data.orders)?data.orders:[];
  const activities=Array.isArray(data.activities)?data.activities:[];
  const orderCount=summary.orders ?? orders.length;
  const opportunities=Array.isArray(data.opportunities)?data.opportunities:[];
  const stamp=value=>{if(value==null)return NaN;return new Date(typeof value==='number'?(value<1e12?value*1000:value):String(value).replace(' ','T')).getTime()};
  const interactionDates=[data.lastInteractionAt,lead.lastContactedAt,...activities.flatMap(item=>[item.lastContactedAt,item.updatedAt,item.createdAt]),...orders.flatMap(item=>[item.updatedAt,item.createdAt]),...opportunities.flatMap(item=>[item.updatedAt,item.createdAt])].map(stamp).filter(Number.isFinite);
  const latest=interactionDates.length?Math.max(...interactionDates):null;
  const records=[...orders.map(item=>({...item,kind:'order'})),...opportunities.map(item=>({...item,kind:'opportunity'}))].sort((a,b)=>stamp(b.updatedAt??b.createdAt)-stamp(a.updatedAt??a.createdAt)).map(item=>({
    id:item.id,kind:item.kind,code:item.code||String(item.id),date:displayDate(item.updatedAt??item.createdAt),amount:money(item.total,item.currency||'VND'),
    products:[...new Set((item.details||[]).map(detail=>detail.productName).filter(Boolean))].join(', '),
    quantities:(item.details||[]).map(detail=>`${detail.quantity??'—'} ${detail.unit||''}`.trim()).join(' · '),
    status:item.statusLabel||item.statusName||'',payment:item.kind==='order'&&item.total>0?(Number(item.paid||0)>=Number(item.total)?'Đã thanh toán':'Chưa thanh toán đủ'):'',
  }));
  return {
    id:customer.id,name:customer.name||lead.customerName||'',phone:customer.mobile||lead.customerMobile||sanitizePhone(phone),
    email:customer.email,address:customer.address,avatar:customer.avatar,saleName:data.saleName,
    status:Number(orderCount)>0?'customer':'lead',lead,summary,tags:data.tags||[],notes:data.notes||[],opportunities:data.opportunities||[],
    kpi:{totalPurchase:summary.total==null?'—':Number(summary.total)>=1e6?`${Math.trunc(Number(summary.total)/1e6)}M`:money(summary.total),totalPurchaseFull:money(summary.total),orderCount,debt:summary.debt==null?'—':money(summary.debt),lastContact:displayDate(latest),lastContactHint:'Ngày hoạt động/cập nhật gần nhất trong dữ liệu API; không đồng nghĩa ngày gọi điện cuối.'},
    commercialRecords:records,
    openItems:activities.filter(item=>Number(item.status)===0).map(item=>({id:item.id,type:'task',title:item.name||item.title||'Công việc',sub:item.dueDate?`Hạn ${displayDate(item.dueDate)}`:'',status:'Chưa xử lý'})),
    orders:orders.map(order=>({...order,rawTotal:order.total,total:money(order.total,order.currency||'VND'),date:displayDate(order.createdAt),status:order.statusLabel||({0:'Mới tạo',1:'Đang xử lý',2:'Hoàn thành'})[order.status]||String(order.status??'—')})),
    timeline:[...activities.map(item=>({tone:'t',title:item.name||item.title||'Công việc',sub:item.note||'',time:displayDate(item.createdAt),at:item.createdAt})),...orders.map(order=>({tone:'p',title:`Đơn hàng ${order.code||''}`,sub:money(order.total,order.currency||'VND'),time:displayDate(order.createdAt),at:order.createdAt}))].sort((a,b)=>new Date(typeof b.at==='number'?b.at:String(b.at).replace(' ','T'))-new Date(typeof a.at==='number'?a.at:String(a.at).replace(' ','T'))),
  };
}

/* Tra cứu khách theo SĐT; API lỗi hoặc chưa có thì dùng dữ liệu mẫu */
export const findCustomerByPhone = async (phone) => {
  const mock = findMockCustomer(phone);
  try {
    const { data, errorCode } = await RequestUtils.Get(
      CUSTOMER_BY_PHONE_API,
      { phone: sanitizePhone(phone) }
    );
    if (errorCode === SUCCESS_CODE && data) {
      return normalizeCallCustomer(data, phone);
    }
  } catch (error) {
    /* bỏ qua, dùng dữ liệu mẫu */
  }
  return mock;
};

/* Gợi ý khách khi đang gõ số trên bàn phím */
export const suggestCustomer = (phone) => {
  const digits = sanitizePhone(phone);
  if (digits.length < 4) {
    return null;
  }
  return MOCK_CUSTOMERS.find(item => sanitizePhone(item.phone).startsWith(digits)) || null;
};
