import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import ListOrder from 'containers/Order/List';
import { InAppEvent } from "@flast-erp/core/utils/FuseUtils";
import { HASH_MODAL } from 'configs';

// Status ID của trạng thái "Đang sản xuất"
const STATUS_PRODUCTION = 2;

const OrderProduction = () => {
    const navigate = useNavigate();
    const [title] = useState("Đơn hàng đang sản xuất");

    const urlParams = new URLSearchParams(window.location.search);
    const filter = {
        type: "order",
        detailStatus: STATUS_PRODUCTION,
        ...urlParams
    };

    const extraActions = [
        {
            children: 'Đánh giá',
            type: 'default',
            style: { color: '#52c41a', borderColor: '#52c41a' },
            onClick: (record) => {
                // Lấy danh sách details từ đơn hàng
                // const details = record.details || [];
                // console.log('Chi tiết đơn hàng:', record);
                // if (details.length === 0) {
                //     message.warning('Đơn hàng này không có chi tiết nào để tạo lô hàng');
                //     return;
                // }
                
                // InAppEvent.emit(HASH_MODAL, {
                //     hash: '#qc.inspection.batch',
                //     title: 'Tạo mới Lô hàng - ' + record.code,
                //     data: {
                //         orderDetails: details.map(detail => ({
                //             orderDetailCode: detail.code,
                //             orderDetailId: detail.id,
                //             productId: detail.productId,
                //             productCode: detail.productCode || detail.product?.code,
                //             productName: detail.productName,
                //             name: detail.name,
                //             quantity: detail.quantity,
                //             skuId: detail.skuId,
                //             customerOrder: record
                //         }))
                //     }
                // });
                // // const details = record.details || [];

                // if (details.length === 0) {
                //     message.warning('Đơn hàng này không có chi tiết nào để tạo lô hàng');
                //     return;
                // }

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
            <CustomBreadcrumb
                data={[{ title: 'Trang chủ' }, { title: title }]}
            />
            <ListOrder filter={filter} hideQuoteButton={true} extraActions={extraActions} />
        </>
    );
};

export default OrderProduction;
