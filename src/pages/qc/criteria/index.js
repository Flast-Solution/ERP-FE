import React, { useState } from 'react';
import RestList from "@flast-erp/core/components/RestLayout/RestList";
import useGetList from "@flast-erp/core/hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import Filter from './Filter';
import { Button, Space, Tag } from 'antd';
import { InAppEvent } from "@flast-erp/core/utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import { cloneDeep } from 'lodash';

const QC_EVALUATION_TYPES = {
    1: 'BOOLEAN',
    2: 'SCORE',
    3: 'QUANTITY',
    4: 'TEXT'
};

const checkPass = (item) => {
  const value = Number(item.targetValue);

  return item.evaluationType === 1
    ? item.targetValue === "Đạt"
    : value >= item.targetMin &&
      (item.targetMax == null || value <= item.targetMax);
};

const CriteriaIndex = () => {
    const [title] = useState("Quản lý Tiêu chí QC");

    const onCreate = () => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.criteria.edit',
        title: 'Tạo mới Tiêu chí QC',
        data: {}
    });

    const onEdit = (item) => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.criteria.edit',
        title: 'Sửa Tiêu chí QC # ' + item.idQcCriteria,
        data: cloneDeep(item)
    });

    const onError = (item) => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.criteria.error',
        title: 'Thêm lỗi theo tiêu chí # ' + item.idQcCriteria,
        data: cloneDeep(item)
    });

    const columns = [
        {
            title: "Mã",
            dataIndex: 'qcCriteriaCode',
            width: 120,
            ellipsis: true
        },
        {
            title: "Tên tiêu chí",
            dataIndex: 'qcCriteriaName',
            width: 250,
            ellipsis: true,
            render: (text, record) => <a onClick={() => onEdit(record)} style={{ cursor: 'pointer' }}>{text}</a>
        },
        {
            title: "Trọng số",
            dataIndex: 'weight',
            width: 100,
            render: (weight) => weight ? `${weight}%` : '-'
        },
        {
            title: "Phiên bản",
            dataIndex: 'version',
            width: 100
        },
        {
            title: "Loại",
            dataIndex: 'evaluationType',
            width: 150,
            render: (type) => <Tag color="blue">{QC_EVALUATION_TYPES[type] || 'Unknown'}</Tag>
        },
        {
            title: "Trạng thái",
            dataIndex: 'isActive',
            width: 120,
            render: (isActive) => (
                <Tag color={isActive === 1 ? 'green' : 'red'}>
                    {isActive === 1 ? 'Kích hoạt' : 'Ngưng'}
                </Tag>
            )
        },
        {
            title: "Hành động",
            width: 120,
            fixed: 'right',
            render: (record) => {
                const isPass = checkPass(record);
                return (
                    <Space>
                        <Button type="primary" ghost onClick={() => onEdit(record)} size='small'>Sửa</Button>
                        {isPass ? "" : <Button color="danger" variant="solid"size='small' onClick={() => onError(record)}>Nhập lỗi</Button>}
                    </Space>
                )
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
            <RestList
                xScroll={1000}
                initialFilter={{ limit: 10, page: 1 }}
                filter={<Filter />}
                useGetAllQuery={useGetList}
                apiPath={'qms/qc-criteria/fetch'}
                customClickCreate={onCreate}
                columns={columns}
            />
        </>
    );
};

export default CriteriaIndex;
