export const PRODUCT_FORM_EDIT_EVENT = 'erp-product-form-edit';

export const notifyProductFormEdit = () => {
  window.dispatchEvent(new Event(PRODUCT_FORM_EDIT_EVENT));
};

export const shouldConfirmProductLeave = (userEdited) => userEdited === true;
