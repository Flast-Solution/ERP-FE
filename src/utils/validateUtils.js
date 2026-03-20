import i18next from 'i18next';

export const validateRegex = {
  phone: /^[+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/g,
  password: /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*\d).{6,}$/g,
  username: /^([a-z0-9A-Z_-]{3,100})$/g,
  editBookingId: '#bookings/(.*)/edit',
  fullName: /^[a-z0-9 ]{3,100}$/iu,
  number: /^[0-9]+$/iu,
  url: /(https?:\/\/[^\s]+)/g,
  accountNo: /^[\s./0-9]+$/iu,
  customerName: /\S+/,
};

export const getPasswordRules = () => [
  {
    pattern: validateRegex.password,
    message: i18next.t('input.password.validateMsg.pattern'),
  },
];

export const getConfirmPasswordRules = (name = 'password') => [
  ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue(name) === value) {
        return Promise.resolve();
      }
      return Promise.reject(
        <p>{`${i18next.t('input.confirmNewPassword.validateMsg.match')}`}</p>,
      );
    },
  }),
];
