import { useGetShipStatusQuery } from 'hooks/useData';
import FormSelectInfinite from './FormSelectInfinite';

const FormInfiniteShipStatus = props => {
  return (
    <FormSelectInfinite
      useGetAllQuery={useGetShipStatusQuery}
      name="status"
      valueProp="id"
      titleProp="name"
      searchKey="name"
      filterField="id"
      initialFilter={{page: 1}}
      {...props}
    />
  );
};

export default FormInfiniteShipStatus;
