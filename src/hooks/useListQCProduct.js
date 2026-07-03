import { useData } from "@flast-erp/core/hooks";

export const useListQCProduct = ({ queryParams, onCompleted }) =>
	useData({ queryParams, onCompleted, api: 'qms/product-checklist/get-product' });
