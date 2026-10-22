import React from 'react';
import ProductAssignmentModal from './ProductAssignmentModal';
import { fetchContentOptions } from '@/pages/category/contentAssignmentService';

const columns = [
  {
    title: 'Tên trang tin tức',
    dataIndex: 'name',
    render: (name, record) => name || record.title || '—',
  },
  { title: 'Slug', dataIndex: 'slug', ellipsis: true, width: 240 },
];

const ContentAssignmentModal = (props) => (
  <ProductAssignmentModal
    {...props}
    fetchProducts={fetchContentOptions}
    columns={columns}
    itemLabel="trang tin tức"
    successMessage="Đã gắn trang tin tức thành công."
  />
);

export default ContentAssignmentModal;
