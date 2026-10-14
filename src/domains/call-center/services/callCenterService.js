import { RequestUtils } from '@flast-erp/core/utils';
import { SUCCESS_CODE } from '@/configs';
import { MOCK_CUSTOMERS } from '../mocks/customers';
import { sanitizePhone } from '../utils/format';

const CUSTOMER_BY_PHONE_API = '/customer/find-by-phone';

const findMockCustomer = (phone) => {
  const target = sanitizePhone(phone);
  return MOCK_CUSTOMERS.find(item => sanitizePhone(item.phone) === target) || null;
};

/* Tra cứu khách theo SĐT; API lỗi hoặc chưa có thì dùng dữ liệu mẫu */
export const findCustomerByPhone = async (phone) => {
  const mock = findMockCustomer(phone);
  try {
    const { data, errorCode } = await RequestUtils.Get(
      CUSTOMER_BY_PHONE_API,
      { phone: sanitizePhone(phone) }
    );
    if (errorCode === SUCCESS_CODE && data) {
      return { ...(mock || {}), ...data };
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
