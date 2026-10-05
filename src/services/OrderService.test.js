import { normalizeOrderDetail } from './OrderService';
import OrderTextTableOnly from '../containers/Order/OrderTextTableOnly';

jest.mock('@/configs', () => ({ SUCCESS_CODE: 200 }), { virtual: true });
jest.mock('@flast-erp/core/utils', () => ({ RequestUtils: {}, arrayEmpty: value => !value?.length }), { virtual: true });

test.each([[1300, 50024000, '1,924'], [1700, 65416000, '2,516']])(
  'displays view-on-edit VND totalPrice in USD once for %s meters', (quantity, totalPrice, expected) => {
    const order = { currency: 'USD', exchangeRate: 26000 };
    const detail = normalizeOrderDetail({ id: 1, price: 38480, quantity, totalPrice }, {}, order);
    expect(detail.totalPrice).toBe(totalPrice);
    const table = OrderTextTableOnly({ details: [detail], currency: 'USD', orderCurrency: 'USD', exchangeRate: 26000 });
    expect(table.props.columns.find(column => column.title === 'Thành tiền').render(null, detail).props.children).toBe(expected);
  },
);
