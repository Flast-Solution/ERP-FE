/**************************************************************************/
/*  utils.js                                                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/
import { arrayEmpty, formatTime, formatMoney } from 'utils/dataUtils';

export const renderArrayColor = (datas, colors) => {
  if (arrayEmpty(datas) || arrayEmpty(colors)) {
    return "";
  }
  if (datas.length !== colors.length) {
    return ""
  }
  return datas.map((item, index) => (
    <div key={item.id} style={{ color: colors[index]?.color || 'inherit' }}>
      {item.id} - {item.name}
    </div>
  ));
}

export const ORDER_COLUMN_ACTION = [
  {
    title: 'Mã đơn',
    dataIndex: 'code',
    key: 'code',
    width: 150,
    ellipsis: true
  },
  {
    title: 'Kinh doanh',
    dataIndex: 'userCreateUsername',
    key: 'userCreateUsername',
    width: 120,
    ellipsis: true
  },
  {
    title: 'Sản phẩm',
    dataIndex: 'products',
    key: 'products',
    width: 150,
    ellipsis: true,
    render: (products, record) => renderArrayColor(products, record.detailstatus)
  },
  {
    title: 'T.G Chốt',
    dataIndex: 'opportunityAt',
    key: 'opportunityAt',
    width: 120,
    ellipsis: true,
    render: (time) => formatTime(time)
  },
  {
    title: 'Họ tên',
    dataIndex: 'customerReceiverName',
    key: 'customerReceiverName',
    width: 130,
    ellipsis: true
  },
  {
    title: 'Số điện thoại',
    dataIndex: 'customerMobilePhone',
    key: 'customerMobilePhone',
    width: 130,
    ellipsis: true
  },
  {
    title: 'Tỉnh/T.P',
    dataIndex: 'customerAddress',
    key: 'customerAddress',
    width: 120,
    ellipsis: true,
    render: (address) => address || '(Chưa có)'
  },
  {
    title: 'Ngày đặt',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 130,
    ellipsis: true,
    render: (time) => formatTime(time)
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'total',
    key: 'total',
    width: 130,
    ellipsis: true,
    render: (total) => formatMoney(total)
  },
  {
    title: 'Giảm giá',
    dataIndex: 'priceOff',
    key: 'priceOff',
    width: 130,
    ellipsis: true,
    render: (priceOff) => formatMoney(priceOff)
  },
  {
    title: 'Phí ship',
    dataIndex: 'shippingCost',
    key: 'shippingCost',
    width: 130,
    ellipsis: true,
    render: (shippingCost) => formatMoney(shippingCost)
  },
  {
    title: 'Thanh toán',
    dataIndex: 'paid',
    key: 'paid',
    width: 130,
    ellipsis: true,
    render: (paid) => formatMoney(paid)
  },
  {
    title: 'Còn lại',
    key: 'remainingAmount',
    width: 130,
    ellipsis: true,
    render: (record) => formatMoney(record.total - record.paid)
  }
];