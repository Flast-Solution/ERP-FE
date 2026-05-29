import React, { useCallback, useState } from 'react';
import { Button, Image, Popconfirm, Space, Tag } from 'antd';
import RestList from '@flast-erp/core/components/RestLayout/RestList';
import useGetList from '@flast-erp/core/hooks/useGetList';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { cloneDeep } from 'lodash';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { HASH_MODAL } from 'configs';
import QcService from 'services/QcService';
import { getStaticImageUrl } from '@/utils/tools';
import Filter from './Filter';

const SEVERITY_COLOR_MAP = {
    MINOR: 'gold',
    MAJOR: 'orange',
    CRITICAL: 'red'
};

const SEVERITY_LABEL_MAP = {
    MINOR: 'Nhẹ',
    MAJOR: 'Trung bình',
    CRITICAL: 'Nặng'
};

const getDefectId = (item = {}) => item.idQcDefect || item.id || item.qcDefectId;

const normalizeImageUrls = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (_) {
            // Keep fallback behavior below for plain string values.
        }
        return [trimmed];
    }
    return [];
};

const DefectIndex = () => {
    const [title] = useState('QC Defect management');

    const onCreate = () => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.defect.edit',
        title: 'Tạo mới thông tin lỗi',
        data: {}
    });

    const onEdit = (item) => InAppEvent.emit(HASH_MODAL, {
        hash: '#draw/qc.defect.edit',
        title: 'Edit QC Defect # ' + getDefectId(item),
        data: cloneDeep(item)
    });

    const onDelete = useCallback(async (item) => {
        const id = getDefectId(item);
        const res = await QcService.deleteDefect(id);
        const isSuccess = res?.errorCode === 200;

        if (isSuccess) {
            f5List('qms/qc-defect/fetch');
        }

        InAppEvent.normalInfo(
            isSuccess ? 'Delete success' : (res?.message || 'Delete failed')
        );
    }, []);

    const columns = [
        {
            title: 'Mã lỗi',
            dataIndex: 'defectCode',
            width: 140,
            ellipsis: true
        },
        {
            title: 'Tên lỗi',
            dataIndex: 'defectName',
            width: 250,
            ellipsis: true,
            render: (text, record) => (
                <span
                    onClick={() => onEdit(record)}
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Mức độ',
            dataIndex: 'severity',
            width: 120,
            render: (severity) => (
                <Tag color={SEVERITY_COLOR_MAP[severity] || 'blue'}>
                    {SEVERITY_LABEL_MAP[severity] || '-'}
                </Tag>
            )
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productCode',
            width: 150,
            ellipsis: true
        },
        {
            title: 'Images',
            dataIndex: 'imageUrl',
            width: 240,
            render: (imageUrl) => {
                const urls = normalizeImageUrls(imageUrl);
                if (!urls.length) return '-';
                return (
                    <Image.PreviewGroup items={urls.map((url) => getStaticImageUrl(url))}>
                        <Space wrap size={6}>
                            {urls.slice(0, 3).map((url, index) => (
                                <Image
                                    key={`${url}-${index}`}
                                    src={getStaticImageUrl(url)}
                                    alt={`defect-${index}`}
                                    width={44}
                                    height={44}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                            ))}
                            {urls.length > 3 && <Tag>+{urls.length - 3}</Tag>}
                        </Space>
                    </Image.PreviewGroup>
                );
            }
        },
        {
            title: 'Actions',
            width: 160,
            fixed: 'right',
            render: (record) => (
                <Space>
                    <Button type="primary" ghost onClick={() => onEdit(record)} size="small">Edit</Button>
                    <Popconfirm
                        title="Delete QC Defect"
                        description="Are you sure you want to delete this item?"
                        onConfirm={() => onDelete(record)}
                        okText="Delete"
                        cancelText="Cancel"
                    >
                        <Button danger size="small">Delete</Button>
                    </Popconfirm>
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
                data={[{ title: 'Home' }, { title }]}
            />
            <RestList
                xScroll={1200}
                initialFilter={{ limit: 10, page: 1 }}
                filter={<Filter />}
                useGetAllQuery={useGetList}
                apiPath={'qms/qc-defect/fetch'}
                customClickCreate={onCreate}
                columns={columns}
            />
        </>
    );
};

export default DefectIndex;
