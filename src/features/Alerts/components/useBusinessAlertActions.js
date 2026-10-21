import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs';
import { createBusinessReader } from '../businessModel';
import { useCallCenterStore } from '@/domains/call-center/store/useCallCenterStore';
import useGetMe from '@/hooks/useGetMe';

export default function useBusinessAlertActions(alert, scenario, refresh, onNavigate) {
  const navigate = useNavigate();
  const { user, hasPermission } = useGetMe();
  const go = (path) => {
    navigate(path);
    onNavigate?.();
  };
  const dial = useCallCenterStore((state) => state.dial);
  const connection = useCallCenterStore((state) => state.connection);
  const read = createBusinessReader(alert || {});
  const orderId =
    read('order.id', 'orderId') ??
    (alert?.entityData?.kind === 'ORDER' ? alert.entityData.id : undefined);
  const code = read('order.code', 'orderCode') || alert?.code;
  const callAvailable = Boolean(String(user?.sipExt ?? '').trim());
  const allowed = (permission) => !permission || hasPermission(permission);
  const permission = {
    lead: 'sales.lead.view',
    opportunity: 'sales.order.update',
    unplanned: 'manufacturing.order.view',
    debt: 'sales.order.payment.create',
    production: 'supplier.view',
    pod: 'shipping.delivery.view',
  }[scenario];
  const open = async (target) => {
    if (!alert) return;
    try {
      if (target === 'primary') {
        if (scenario === 'lead') {
          const phone = read(
            'customer.mobile',
            'customer.mobilePhone',
            'lead.customerMobile',
            'phone',
            'customerPhone',
          );
          if (!phone)
            return message.info(
              'Cảnh báo chưa có số điện thoại. Mở lead để xem thông tin liên hệ.',
            );
          if (!callAvailable || connection !== 'online')
            return message.info('Máy nhánh chưa sẵn sàng để gọi.');
          await dial(String(phone));
          return;
        }
        if (scenario === 'debt' || scenario === 'opportunity') {
          const id = orderId ?? (scenario === 'opportunity' ? alert.entityData?.id : undefined);
          if (id == null)
            return message.info('Cảnh báo chưa có ID đơn hàng/cơ hội để mở thao tác.');
          const response = await RequestUtils.Get('/erp/order/view-on-edit', { orderId: id });
          if (
            response?.success === false ||
            (response?.errorCode != null && Number(response.errorCode) !== 200)
          )
            throw new Error(response.message || 'Không tải được đơn hàng.');
          const data = response.data;
          const order = data?.order || data;
          if (!order?.id) throw new Error('API chưa trả thông tin đơn hàng.');
          InAppEvent.emit(HASH_MODAL, {
            hash: '#order.payment',
            title: `${scenario === 'opportunity' ? 'Chuyển cơ hội thành đơn' : 'Ghi nhận thanh toán'} · ${order.code || code}`,
            data: {
              customerOrder: order,
              simplifiedPayment: scenario === 'opportunity',
              details: data?.data || order.details || [],
              customer: data?.customer,
              onSave: () => refresh?.(),
            },
          });
          return;
        }
        if (scenario === 'unplanned') {
          go(`/material/bom?orderCode=${encodeURIComponent(code || '')}`);
          return;
        }
        if (scenario === 'production') {
          go('/provider');
          return;
        }
        if (scenario === 'pod') {
          await open('shipping');
          return;
        }
      }
      if (target === 'lead') {
        go('/lead');
        return;
      }
      if (target === 'opportunity') {
        go(`/sale/co-hoi?code=${encodeURIComponent(code || '')}`);
        return;
      }
      if (target === 'shipping') {
        const shipping = read('shipping', 'shipment');
        if (shipping?.id != null) {
          InAppEvent.emit(HASH_MODAL, {
            hash: '#ship.update',
            title: `Lệnh giao · ${shipping.deliveryCode || shipping.id}`,
            data: shipping,
          });
        } else
          go(
            `/ship?orderCode=${encodeURIComponent(read('shipping.orderCode', 'orderCode') || '')}`,
          );
        return;
      }
      go(`/sale/order?code=${encodeURIComponent(code || '')}`);
    } catch (error) {
      message.error(error.message || 'Không mở được thao tác nghiệp vụ.');
    }
  };
  return {
    open,
    visible: scenario !== 'lead' || callAvailable,
    disabled: !allowed(permission) || (scenario === 'lead' && connection !== 'online'),
  };
}
