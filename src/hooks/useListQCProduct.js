import { useData } from "@flast-erp/core/hooks";

export const useListQCProduct = ({ queryParams, onCompleted }) =>
	useData({ queryParams, onCompleted, api: 'erp/product-checklist/get-product' });
