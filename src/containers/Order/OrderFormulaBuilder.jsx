import React, { useRef, useState } from 'react';
import { Alert, Button, Input, Space, Typography } from 'antd';
import { describeFormula, evaluateOrderFormula, FORMULA_FIELDS } from './orderFormula';
import { formatOrderCurrency } from './orderFormatting';

const { Text } = Typography;
const SAMPLE = { key: 'sample', productName: 'Dữ liệu minh họa', productPrice: 100, productPriceV: 100000, quantity: 2, profit: 20 };
const DEFAULT = { name: 'Cấu hình tính giá bán', expression: 'productPrice * (1 + profit%)', shippingMode: 'separate' };

const OrderFormulaBuilder = ({ formula, defaultFormula, lines, currency, shippingCost, orderedQuantity, onApply, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT);
  const inputRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const startEditing = () => {
    const current = formula?.expression ? formula : defaultFormula || DEFAULT;
    setDraft({ ...current });
    selectionRef.current = { start: current.expression.length, end: current.expression.length };
    setEditing(true);
  };
  const rememberSelection = event => {
    selectionRef.current = { start: event.target.selectionStart, end: event.target.selectionEnd };
  };
  const updateExpression = expression => setDraft(current => ({ ...current, name: DEFAULT.name, expression,
    shippingMode: /\bshippingCost\b/.test(expression) ? 'included' : 'separate' }));
  const insertToken = token => {
    const { start, end } = selectionRef.current;
    updateExpression(draft.expression.slice(0, start) + token + draft.expression.slice(end));
    const caret = start + token.length;
    selectionRef.current = { start: caret, end: caret };
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.resizableTextArea?.textArea?.setSelectionRange(caret, caret);
    });
  };
  const previewLines = lines.length ? lines : [SAMPLE];
  const context = { currency, shippingCost, orderedQuantity: lines.length ? orderedQuantity : SAMPLE.quantity };
  const preview = previewLines.map(line => ({ ...line, result: evaluateOrderFormula(draft, line, context) }));
  const errors = preview.filter(line => line.result.error);
  const apply = () => {
    if (errors.length || !draft.expression.trim()) return;
    if (onApply({ ...draft, expression: draft.expression.trim() })) setEditing(false);
  };

  return <section aria-label="Cấu hình công thức tính giá bán" style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 8 }}>
    <Space wrap style={{ width: '100%', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <Text strong>Công thức tính giá bán</Text>
        <div style={{ marginTop: 4 }}><Text type="secondary">{formula?.expression
          ? describeFormula(formula.expression) : 'Cấu hình công thức để tính giá bán cho các sản phẩm.'}</Text></div>
      </div>
      <Space wrap>
        {formula?.expression && <Button disabled={disabled || !lines.length} onClick={() => onApply(formula)}>Áp dụng lại</Button>}
        <Button disabled={disabled} onClick={startEditing}>Cấu hình công thức</Button>
      </Space>
    </Space>
    <div style={{ marginTop: 8 }}><Text type="secondary">Áp dụng công thức để điền giá bán. Sau đó bạn có thể sửa tay mọi dữ liệu; công thức chỉ tính lại khi bấm áp dụng.</Text></div>
    {editing && <div style={{ marginTop: 16, maxWidth: 840 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>Chèn trường</Text>
        <Space wrap style={{ display: 'flex', marginTop: 6 }}>
          {FORMULA_FIELDS.map(field => <Button key={field.value} size="small" disabled={disabled}
            title={field.description} onClick={() => insertToken(field.value)}>{field.label}</Button>)}
        </Space>
        <Space wrap style={{ display: 'flex', marginTop: 8 }}>
          {['+', '-', '*', '/', '%', '(', ')'].map(operator => <Button key={operator} size="small"
            disabled={disabled} aria-label={`Chèn ${operator}`} onClick={() => insertToken(operator)}>{operator}</Button>)}
        </Space>
      </div>
      <label htmlFor="order-formula-expression">Công thức tính đơn giá bán ({currency})</label>
      <Input.TextArea ref={inputRef} id="order-formula-expression" value={draft.expression} rows={3}
        maxLength={2000} disabled={disabled} style={{ marginTop: 6, fontFamily: 'monospace' }}
        onSelect={rememberSelection} onClick={rememberSelection} onKeyUp={rememberSelection}
        onChange={event => { rememberSelection(event); updateExpression(event.target.value); }}
        placeholder="Ví dụ: productPrice * (1 + profit%)" />
      <div style={{ marginTop: 6 }}><Text type="secondary">{describeFormula(draft.expression)}</Text></div>
      <div><Text type="secondary">Nhập trực tiếp số và biểu thức, hoặc bấm để chèn tại vị trí con trỏ. 20% = 0,2.</Text></div>
      {draft.shippingMode === 'included' && <div style={{ marginTop: 8 }}><Text type="secondary">Công thức sử dụng phí vận chuyển: phí được phân bổ vào giá bán, không cộng thêm vào tổng đơn.</Text></div>}
      <div style={{ marginTop: 12 }}>
        {errors.length ? <Alert type="error" showIcon message="Chưa thể áp dụng công thức"
          description={errors.map(line => `${line.productName || line.key}: ${line.result.error}`).join('; ')} />
          : <Text>Giá bán dự kiến {lines.length ? `của ${preview[0].productName || 'sản phẩm đầu tiên'}` : `(ví dụ: giá mua ${formatOrderCurrency(currency === 'USD' ? SAMPLE.productPrice : SAMPLE.productPriceV, currency)}, số lượng 2, lợi nhuận 20%)`}: <strong>{formatOrderCurrency(preview[0].result.price, currency)}</strong>{lines.length > 1 ? ` · Áp dụng cho ${lines.length} sản phẩm` : ''}</Text>}
      </div>
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" disabled={disabled || errors.length > 0 || !draft.expression.trim()} onClick={apply}>Áp dụng công thức</Button>
        <Button onClick={() => setEditing(false)}>Hủy</Button>
      </Space>
    </div>}
  </section>;
};

export default OrderFormulaBuilder;
