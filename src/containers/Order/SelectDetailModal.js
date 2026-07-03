import React, { useState } from 'react';
import { Button, Table, Tag, message } from 'antd';
import { formatMoney, InAppEvent } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs';
import { RestEditModal } from '@flast-erp/core/components';
import styled from 'styled-components';

const StyledModal = styled.div`
    .detail-header {
        background: #FFC015;
        padding: 16px 24px;
        margin: -24px -24px 24px -24px;
        border-radius: 8px 8px 0 0;
        h3 {
            color: #fff;
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
    }
`;

const SelectDetailModal = ({ data, closeModal }) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const details = data?.details || [];

    const columns = [
        {
            title: 'STT',
            width: 60,
            render: (_, __, index) => index + 1
        },
        {
            title: 'Mã sản phẩm',
            dataIndex: 'productCode',
            width: 120,
            render: (code) => code || '-'
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'productName',
            ellipsis: true
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            width: 100,
            align: 'right'
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            width: 120,
            align: 'right',
            render: (price) => formatMoney(price)
        },
        {
            title: 'Trạng thái',
            dataIndex: 'detailStatusName',
            width: 120,
            render: (status) => (
                <Tag color={status ? 'blue' : 'default'}>
                    {status || 'Mới'}
                </Tag>
            )
        }
    ];

    const onCreateLot = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 sản phẩm');
            return;
        }

        selectedRowKeys.forEach((detailId, index) => {
            const detail = details.find(d => d.id === detailId);
            if (!detail) return;

            setTimeout(() => {
                InAppEvent.emit(HASH_MODAL, {
                    hash: '#qc.inspection.batch',
                    title: `Lô kiểm tra - ${detail.productName || detail.productCode}`,
                    data: {
                        orderDetailCode: data?.code,
                        orderId: data?.id,
                        productCode: detail.productCode,
                        productName: detail.productName,
                        quantity: detail.quantity,
                        customerOrder: data
                    }
                });
            }, index * 200);
        });

        closeModal();
    };

    return (
        <StyledModal>
            <RestEditModal
                isMergeRecordOnSubmit={false}
                onSubmit={onCreateLot}
                record={data}
                closeModal={closeModal}
                footer={null}
            >
                <div className="detail-header">
                    <h3>Chọn sản phẩm để tạo lô kiểm tra</h3>
                </div>

                <div style={{ marginBottom: 16, color: '#666' }}>
                    Đơn hàng: <strong>{data?.code}</strong> - Khách hàng: <strong>{data?.customerName || '-'}</strong>
                </div>

                <Table
                    dataSource={details}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                        type: 'checkbox'
                    }}
                    pagination={false}
                    locale={{ emptyText: 'Không có sản phẩm nào' }}
                    scroll={{ y: 300 }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                    <Button onClick={closeModal}>Hủy</Button>
                    <Button type="primary" onClick={onCreateLot}>
                        Tạo lô kiểm tra ({selectedRowKeys.length})
                    </Button>
                </div>
            </RestEditModal>
        </StyledModal>
    );
};

export default SelectDetailModal;
