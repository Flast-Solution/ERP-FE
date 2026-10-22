import React from 'react';
import { f5List } from '@flast-erp/core/utils';
import ProductAssignmentModal from '@/components/ProductAssignmentModal';
import { fetchCategoryProductOptions, saveCategoryProducts } from './productAssignmentService';

const AssignProductsModal = ({ category, onClose }) => (
  <ProductAssignmentModal
    title="Thêm sản phẩm vào danh mục"
    subjectLabel="Danh mục"
    subjectName={category.name}
    initialSelectedIds={category.productIds}
    fetchProducts={fetchCategoryProductOptions}
    onSave={(productIds) => saveCategoryProducts(category.id, productIds)}
    onSaved={() => f5List('category/product/fetch')}
    onClose={onClose}
    successMessage="Đã gắn sản phẩm vào danh mục."
  />
);

export default AssignProductsModal;
