import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import ListOrder from '@/containers/Order/List';

const getManufactureDetails = (record = {}) => {
    const nestedManufactureDetails = Array.isArray(record.manufactureProduct)
        ? record.manufactureProduct.flatMap(item => item?.details ?? [])
        : [];
    const candidates = [
        nestedManufactureDetails,
        record.manufactureProduct?.details,
        record.manufactureDetails,
        record.details,
    ];
    return candidates.find(items => Array.isArray(items) && items.length > 0) ?? [];
};

const isProviderOrder = (record) => getManufactureDetails(record).some(detail => (
    detail?.providerId !== undefined && detail?.providerId !== null && detail?.providerId !== ''
));

const OrderProduction = () => {

    const navigate = useNavigate();
    const [ title ] = useState("Đơn hàng đang sản xuất");

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('limit');
    urlParams.delete('page');
    urlParams.delete('type');
    urlParams.delete('detailStatus');
    const filter = Object.fromEntries(urlParams.entries());

    const extraActions = [
        {
            children: 'Tạo lô hàng',
            type: 'default',
            style: { color: '#52c41a', borderColor: '#52c41a' },
            visible: record => !isProviderOrder(record),
            onClick: (record) => {
                const details = record?.details || [];
                navigate('/sale/production/lots/create', {
                    state: {
                        orderDetails: details.map(detail => ({
                            orderDetailCode: detail.code,
                            orderDetailId: detail.id,
                            productId: detail.productId,
                            productCode: detail.productCode || detail.product?.code,
                            productName: detail.productName,
                            name: detail.name,
                            quantity: detail.quantity,
                            skuId: detail.skuId,
                            customerOrder: record
                        })),
                        customerOrder: record
                    }
                });
            }
        }
    ];

    return (
        <>
            <Helmet>
                <title>{title}</title>
            </Helmet>
            <BreadcrumbCustom
                data={[{ title: 'Trang chủ' }, { title: title }]}
            />
            <ListOrder
                filter={filter}
                apiPath="erp/manufacture/get-order"
                initialPage={0}
                orderMode
                hideQuoteButton={true}
                disableWorkflowAttach={true}
                showWorkflowProgressAction
                detailDrawerHash="#order.production.overview"
                detailDrawerTitle=""
                extraActions={extraActions}
            />
        </>
    );
};

export default OrderProduction;
