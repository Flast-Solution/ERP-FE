import OrderTextTableOnly from './OrderTextTableOnly';
import { formatMoneyAmount } from '../../utils/formatCurrency';

const detail = { id: 34178, price: 38480, quantity: 1300, total: 50024000 };

test.each([
  ['USD', 1.48, 1924],
  ['VND', 38480, 50024000],
])('renders WG01 unit price and line total consistently in %s', (currency, price, total) => {
  const table = OrderTextTableOnly({ details: [detail], currency, orderCurrency: currency, exchangeRate: 26000 });
  const columns = table.props.columns;
  expect(columns.find(column => column.dataIndex === 'price').render(detail.price))
    .toBe(formatMoneyAmount(price, currency));
  expect(columns.find(column => column.title === 'Thành tiền').render(null, detail).props.children)
    .toBe(formatMoneyAmount(total, currency));
});
