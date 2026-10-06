const roundUsd = value => Math.round((value + Number.EPSILON) * 100) / 100;

const tokenizeFormula = (formula = '') => {
  const tokens = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = formula.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) throw new Error('Số trong công thức không hợp lệ');
      tokens.push({ type: 'number', value: Number(match[0]) });
      index += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = formula.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      tokens.push({ type: 'identifier', value: match[0] });
      index += match[0].length;
      continue;
    }
    if ('+-*/()%'.includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error(`Ký tự không được hỗ trợ trong công thức: ${char}`);
  }

  return tokens;
};

const evaluateCalculationFormula = (formula, variables) => {
  if (!formula?.trim()) return null;

  try {
    const tokens = tokenizeFormula(formula);
    let cursor = 0;
    const peek = () => tokens[cursor];
    const consume = type => {
      const token = tokens[cursor];
      if (!token || token.type !== type) {
        throw new Error(`Thiếu token ${type}`);
      }
      cursor += 1;
      return token;
    };

    const parsePrimary = () => {
      const token = peek();
      let value;
      if (token?.type === 'number') {
        value = consume('number').value;
      } else if (token?.type === 'identifier') {
        const variableName = consume('identifier').value;
        if (!Object.prototype.hasOwnProperty.call(variables, variableName)) {
          throw new Error(`Biến ${variableName} không tồn tại`);
        }
        value = Number(variables[variableName] ?? 0);
      } else if (token?.type === '(') {
        consume('(');
        value = parseExpression();
        consume(')');
      } else {
        throw new Error('Công thức không hợp lệ');
      }

      while (peek()?.type === '%') {
        consume('%');
        value /= 100;
      }
      return value;
    };

    const parseUnary = () => {
      if (peek()?.type === '+') {
        consume('+');
        return parseUnary();
      }
      if (peek()?.type === '-') {
        consume('-');
        return -parseUnary();
      }
      return parsePrimary();
    };

    const parseTerm = () => {
      let value = parseUnary();
      while (peek()?.type === '*' || peek()?.type === '/') {
        const operator = tokens[cursor].type;
        cursor += 1;
        const right = parseUnary();
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    };

    function parseExpression() {
      let value = parseTerm();
      while (peek()?.type === '+' || peek()?.type === '-') {
        const operator = tokens[cursor].type;
        cursor += 1;
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }

    const result = parseExpression();
    if (cursor !== tokens.length || !Number.isFinite(result)) return null;
    return result;
  } catch (_) {
    return null;
  }
};

export const calculateSalePriceUsd = ({ item, shippingCost, orderedQuantity, formula }) => {
  if (!formula || !(Number(orderedQuantity) > 0)) return null;
  return evaluateCalculationFormula(formula, {
    productPrice: Number(item?.productPrice ?? 0),
    orderedQuantity: Number(orderedQuantity),
    shippingCost: Number(shippingCost ?? 0),
    profit: Number(item?.profit ?? 0),
    price: Number(item?.productPrice ?? 0),
    quantity: Number(item?.quantity ?? 0),
  });
};

const calculateLineTotal = ({ item, shippingCost, orderedQuantity, formula }) => {
  if (/\b(productPrice|orderedQuantity)\b/.test(formula || '')) {
    const price = calculateSalePriceUsd({ item, shippingCost, orderedQuantity: orderedQuantity ?? item?.quantity, formula });
    return price == null ? null : price * Number(item?.quantity ?? 0);
  }
  if (!formula) {
    return Number(item?.productPrice ?? 0) * Number(item?.quantity ?? 0);
  }
  return evaluateCalculationFormula(formula, {
    price: Number(item?.productPrice ?? 0),
    quantity: Number(item?.quantity ?? 0),
    shippingCost: Number(shippingCost ?? 0),
    profit: Number(item?.profit ?? 0),
  });
};

export const calculateUsdLineTotal = ({ item, shippingCost, orderedQuantity, formula }) => {
  const amount = calculateLineTotal({ item, shippingCost, orderedQuantity, formula })
    ?? (Number(item?.productPrice ?? 0) * Number(item?.quantity ?? 0));
  return roundUsd(amount);
};


// Keep the backend VND price, including zero; only missing VND uses USD × rate.
export const resolveSalePriceVnd = (line, rate) => {
  if (line.priceV != null) return Number(line.priceV);
  if (line.price == null) return null;
  return Number(line.price) * rate;
};

export const calculateEditorLine = (line, context) => {
  const rate = Number(context.exchangeRate);
  const usesUnitFormula = context.currency !== 'VND' && /\b(productPrice|orderedQuantity)\b/.test(context.formula || '');
  const computedPrice = usesUnitFormula && (line.price == null || line._recalculateSalePrice)
    ? calculateSalePriceUsd({ ...context, item: line }) : null;
  const price = computedPrice ?? line.price ?? null;
  const salePriceVnd = context.currency === 'VND' ? line.priceV ?? null : resolveSalePriceVnd({ ...line, price }, rate);
  const effectivePrice = context.currency === 'VND' ? line.priceV : price;
  const savedTotal = line.totalPrice ?? line.total;
  let totalPrice;
  if (!line._recalculateTotal && savedTotal != null) {
    totalPrice = Number(savedTotal);
  } else if (effectivePrice != null) {
    totalPrice = roundUsd(Number(effectivePrice) * Number(line.quantity ?? 0) + Number(line.discountAmount ?? 0));
  } else if (context.currency === 'VND') {
    totalPrice = 0;
  } else {
    totalPrice = calculateUsdLineTotal({ ...context, item: line });
  }
  return { ...line, price, salePriceUsd: price, salePriceVnd,
    currency: context.currency, exchangeRate: rate, totalPrice, total: totalPrice };
};
