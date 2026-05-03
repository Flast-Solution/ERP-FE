
import { useListQCProduct } from '@/hooks/useListQCProduct';
import FormSelectInfinite from '@/form-flast/SelectInfinite/FormSelectInfinite';

const FormInfiniteQcProduct = props => {
  return (
    <FormSelectInfinite
      useGetAllQuery={useListQCProduct}
      name="idCheckList"
      valueProp="idQcCheckList"
      titleProp="qcCheckListName"
      initialFilter={{ page: 1 }}
      {...props}
    />
  )
};

export default FormInfiniteQcProduct;
