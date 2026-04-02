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

const ChecklistIndex = () => {
    const [title] = useState("Quản lý Bộ tiêu chí QC");

    const onCreate = () => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.checklist.edit',
        title: 'Tạo mới Bộ tiêu chí QC',
        data: {}
    });

    const onEdit = (item) => {
        let data = cloneDeep(item);
        // Map criteria list object to array of IDs if needed for the form select
        if (Array.isArray(item.qcCriteriaList)) {
            data.criteriaIds = item.qcCriteriaList.map(c => c.idQcCriteria);
        }
        
        InAppEvent.emit(HASH_MODAL, {
            hash: '#draw/qc.checklist.edit',
            title: 'Sửa Bộ tiêu chí QC # ' + item.idQcCheckList,
            data
        });
    }

    const columns = [
        {
            title: "Mã",
            dataIndex: 'qcCheckListCode',
            width: 120,
            ellipsis: true
        },
        {
            title: "Tên bộ tiêu chí",
            dataIndex: 'qcCheckListName',
            width: 300,
            ellipsis: true,
            render: (text, record) => <a onClick={() => onEdit(record)} style={{ cursor: 'pointer' }}>{text}</a>
        },
        {
            title: "Phiên bản",
            dataIndex: 'version',
            width: 100
        },
        {
            title: "Số tiêu chí",
            dataIndex: 'qcCriteriaList',
            render: (list) => list ? (Array.isArray(list) ? list.length : 0) : 0,
            width: 100
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
            title: "",
            width: 100,
            fixed: 'right',
            render: (record) => (
                <Space>
                    <Button type="primary" ghost onClick={() => onEdit(record)} size='small'>Sửa</Button>
                </Space>
            )
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
                apiPath={'qms/qc-checklist/fetch'}
                customClickCreate={onCreate}
                columns={columns}
            />
        </>
    );
};

export default ChecklistIndex;
