const getExchangeRate = (currency, exchangeRate) => currency === 'USD' ? Number(exchangeRate ?? 0) : 1;

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
    return Math.round((result + Number.EPSILON) * 100) / 100;
  } catch (_) {
    return null;
  }
};

const calculateLineTotal = ({ item, shippingCost, formula }) => {
  if (!formula) {
    return Number(item?.price ?? 0) * Number(item?.quantity ?? 0);
  }
  return evaluateCalculationFormula(formula, {
    price: Number(item?.price ?? 0),
    quantity: Number(item?.quantity ?? 0),
    shippingCost: Number(shippingCost ?? 0),
    profit: Number(item?.profit ?? 0),
  });
};

export const calculateConvertedLineTotal = ({ item, shippingCost, formula, currency, exchangeRate }) => {
  const amount = calculateLineTotal({ item, shippingCost, formula })
    ?? (Number(item?.price ?? 0) * Number(item?.quantity ?? 0));
  return Math.round(amount * getExchangeRate(currency, exchangeRate));
};

