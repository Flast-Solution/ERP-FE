import { useEffect } from 'react';
import { installTableScrollbars } from './controller';

const TableScrollbars = () => {
  useEffect(() => installTableScrollbars(), []);
  return null;
};

export default TableScrollbars;
