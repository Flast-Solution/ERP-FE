import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import ListOrder from '@/containers/Order/List';

const STATUS_PRODUCTION = 2;

const OrderProduction = () => {

    const navigate = useNavigate();
    const [ title ] = useState("Đơn hàng đang sản xuất");

    const urlParams = new URLSearchParams(window.location.search);
    const filter = {
        type: "order",
        detailStatus: STATUS_PRODUCTION,
        ...urlParams
    };

    const extraActions = [
        {
            children: 'Tạo lô hàng',
            type: 'default',
            style: { color: '#52c41a', borderColor: '#52c41a' },
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
                hideQuoteButton={true}
                disableWorkflowAttach={true}
                extraActions={extraActions}
            />
        </>
    );
};

export default OrderProduction;
