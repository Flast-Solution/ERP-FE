/* Dữ liệu mẫu theo bản thiết kế, dùng khi chưa có API tổng đài */
export const MOCK_CUSTOMERS = [
  {
    id: 128,
    code: 'KH-00128',
    name: 'Nguyễn Văn A',
    phone: '0912345678',
    status: 'customer',
    saleName: 'Trần Văn B',
    kpi: {
      totalPurchase: '12,4 tr',
      debt: '980 k',
      orderCount: 4,
      lastContact: '8 ngày',
    },
    openItems: [
      {
        type: 'critical',
        title: 'Công nợ quá hạn đơn OA36924870',
        sub: '1.200.000 đ · quá hạn 12 ngày',
        status: 'Mở',
      },
      {
        type: 'high',
        title: 'Khách hàng chưa được chăm sóc',
        sub: '8 ngày không có hoạt động · đã tạo việc',
        status: 'Đã tạo việc',
      },
      {
        type: 'task',
        title: 'Gọi lại cho Nguyễn Văn A',
        sub: 'Việc · hạn hôm nay 10:00 · Trần Văn B',
        status: 'Cao',
      },
    ],
    timeline: [
      { tone: 'g', title: 'Gọi đến · 4 phút', sub: 'Hỏi thời gian sản xuất 2.000 hộp', time: '16/09' },
      { tone: 'p', title: 'Gửi báo giá BG-0928 · 450 tr', sub: 'Khách đã xem 2 lần', time: '17/09' },
      { tone: 'a', title: 'Cảnh báo: chưa được chăm sóc', sub: 'Rule > 7 ngày · đã tạo việc', time: 'Hôm nay' },
      { tone: 't', title: 'Việc "Gọi lại cho Nguyễn Văn A"', sub: 'Giao Trần Văn B · hạn 10:00', time: 'Hôm nay' },
    ],
    orders: [
      { code: 'OA36925190', total: '3.200.000 đ', status: 'Đã thanh toán', date: '02/09' },
      { code: 'OA36924870', total: '1.200.000 đ', status: 'Còn nợ', date: '20/08' },
    ],
  },
];

export const MOCK_RECENT_CALLS = [
  { id: 1, direction: 'missed', phone: '0978112334', name: '', time: '10:42', duration: 0 },
  { id: 2, direction: 'in', phone: '0987654321', name: '', time: '09:15', duration: 204 },
  { id: 3, direction: 'out', phone: '0912345678', name: 'Nguyễn Văn A', time: '08:30', duration: 250 },
];
