import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Row, Col, Button, Upload, Image, Space, Form } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import RequestUtils from '@flast-erp/core/utils/RequestUtils';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { GATEWAY } from 'configs';
import { getStaticImageUrl } from 'utils/tools';

const PAGE_LIMIT = 10;

const SEVERITY_OPTIONS = [
    { id: 'MINOR', name: 'Nhẹ' },
    { id: 'MAJOR', name: 'Trung bình' },
    { id: 'CRITICAL', name: 'Nặng' }
];

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

const normalizeProductData = (response) => {
    const embedded = response?.data?.embedded || response?.embedded || response?.data || [];
    return Array.isArray(embedded) ? embedded : [];
};

const uploadMultipleImages = async (files = []) => {
    if (!files.length) return [null, []];
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', 'qc-defect');

    try {
        const response = await axios.post(
            `${GATEWAY}/upload/folder/multiple`,
            formData,
            {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );

        const payload = response?.data || {};
        const successFlag = payload?.success ?? payload?.data?.success;
        const filesFromRoot = Array.isArray(payload?.files) ? payload.files : [];
        const filesFromData = Array.isArray(payload?.data?.files) ? payload.data.files : [];
        const filesPath = [...filesFromRoot, ...filesFromData].filter(Boolean);
        const isSuccess = successFlag === false ? false : (response?.status >= 200 && response?.status < 300);

        if (!isSuccess) {
            return [payload?.message || payload?.data?.message || 'Upload images failed', []];
        }

        return [null, filesPath];
    } catch (error) {
        const message = error?.response?.data?.message || error?.message || 'Upload images failed';
        return [message, []];
    }
};

const DefectForm = ({ data, closeModal }) => {
    const [form] = Form.useForm();
    const [fileUploads, setFileUploads] = useState([]);
    const [storedImages, setStoredImages] = useState([]);
    const [products, setProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(false);
    const [productHasMore, setProductHasMore] = useState(true);
    const [productKeyword, setProductKeyword] = useState('');
    const productsRef = useRef([]);
    const pageRef = useRef(1);
    const totalRef = useRef(0);
    const productLoadingRef = useRef(false);
    const productHasMoreRef = useRef(true);
    const requestedPagesRef = useRef(new Set());
    const isUpdate = !!(data?.idQcDefect || data?.id || data?.qcDefectId);

    useEffect(() => {
        setStoredImages(normalizeImageUrls(data?.imageUrl));
    }, [data]);

    const mergeProducts = useCallback((prev, incoming) => {
        const merged = [...prev];
        incoming.forEach((item) => {
            const code = item?.code;
            if (!code) return;
            if (!merged.find((p) => p?.code === code)) {
                merged.push(item);
            }
        });
        return merged;
    }, []);

    const loadProducts = useCallback(async (page = 1, append = false) => {
        if (productLoadingRef.current) return;
        if (append && !productHasMoreRef.current) return;
        if (append && requestedPagesRef.current.has(page)) return;
        requestedPagesRef.current.add(page);
        productLoadingRef.current = true;
        setProductLoading(true);
        try {
            const res = await RequestUtils.Get('/erp/product/fetch', {
                limit: PAGE_LIMIT,
                page,
                ...(productKeyword ? { keyword: productKeyword } : {})
            });
            const incoming = normalizeProductData(res);
            const totalElements = Number(
                res?.data?.totalElements
                ?? res?.page?.totalElements
                ?? res?.data?.page?.totalElements
                ?? 0
            );
            totalRef.current = Number.isNaN(totalElements) ? 0 : totalElements;

            const base = append ? productsRef.current : [];
            let next = mergeProducts(base, incoming);
            if (!append && data?.productCode && !next.find((p) => p?.code === data.productCode)) {
                next = mergeProducts(next, [{ code: data.productCode, name: data.productCode }]);
            }
            setProducts(next);
            productsRef.current = next;

            const hasTotal = totalRef.current > 0;
            const hasMoreByTotal = hasTotal ? next.length < totalRef.current : incoming.length >= PAGE_LIMIT;
            const hasNewItem = !append || next.length > base.length;
            const hasMore = hasMoreByTotal && hasNewItem && incoming.length > 0;
            productHasMoreRef.current = hasMore;
            setProductHasMore(hasMore);
            pageRef.current = page;
        } catch (error) {
            InAppEvent.normalError(error?.message || 'Load products failed');
        } finally {
            productLoadingRef.current = false;
            setProductLoading(false);
        }
    }, [data?.productCode, mergeProducts, productKeyword]);

    useEffect(() => {
        const t = setTimeout(() => {
            requestedPagesRef.current.clear();
            loadProducts(1, false);
        }, 250);
        return () => clearTimeout(t);
    }, [productKeyword, loadProducts]);

    const handleLoadMoreProducts = useCallback(async () => {
        if (productLoading || !productHasMore) return;
        await loadProducts(pageRef.current + 1, true);
    }, [loadProducts, productHasMore, productLoading]);

    const handleSearchProduct = useCallback((value) => {
        setProductKeyword(value || '');
        pageRef.current = 1;
        totalRef.current = 0;
        productsRef.current = [];
        requestedPagesRef.current.clear();
        productHasMoreRef.current = true;
        setProductHasMore(true);
    }, []);

    const removeStoredImage = useCallback((idx) => {
        setStoredImages((prev) => prev.filter((_, index) => index !== idx));
    }, []);

    const uploadNow = useCallback(async (file) => {
        const [uploadErr, uploadedUrls] = await uploadMultipleImages([file]);
        if (uploadErr) {
            InAppEvent.normalError(uploadErr);
            return [uploadErr, null];
        }
        const [firstUploaded] = uploadedUrls;
        if (firstUploaded) {
            setStoredImages((prev) => [...prev, firstUploaded]);
        }
        return [null, firstUploaded];
    }, []);

    const removeUploadedByUrl = useCallback((url) => {
        setStoredImages((prev) => prev.filter((item) => item !== url));
    }, []);

    const onSubmit = useCallback(async (values) => {
        const payload = { ...values };
        delete payload.imageUrl;
        payload.imageUrl = storedImages.length <= 1 ? (storedImages[0] || '') : storedImages;

        const res = isUpdate
            ? await QcService.updateDefect(payload)
            : await QcService.addDefect(payload);

        const isSuccess = res?.errorCode === 200;
        if (isSuccess) {
            f5List('qms/qc-defect/fetch');
            closeModal && closeModal();
        }

        InAppEvent.normalInfo(
            isSuccess ? 'Update successfully' : (res?.message || 'Update failed')
        );
    }, [closeModal, isUpdate, storedImages]);

    const formatProductOption = useCallback((code) => {
        const product = products.find((item) => item?.code === code);
        if (!product) return code;
        return `${product.code} - ${product.name || ''}`.trim();
    }, [products]);

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={data}
            closeModal={closeModal}
            form={form}
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'idQcDefect'} />
                <FormHidden name={'id'} />
                <FormHidden name={'qcDefectId'} />
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'defectCode'}
                        label="Mã lỗi"
                        placeholder="Nhập mã lỗi"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'defectName'}
                        label="Tên lỗi"
                        placeholder="Nhập tên lỗi"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        required
                        name={'severity'}
                        label="Mức độ"
                        placeholder="Chọn mức độ"
                        resourceData={SEVERITY_OPTIONS}
                        valueProp="id"
                        titleProp="name"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        name={'productCode'}
                        label="Sản phẩm"
                        placeholder="Chọn sản phẩm"
                        resourceData={products}
                        valueProp="code"
                        titleProp="name"
                        loading={productLoading}
                        enableWaypoint={productHasMore}
                        onEnter={handleLoadMoreProducts}
                        onSearch={handleSearchProduct}
                        showSearch
                        isFilterOption={false}
                        filterOption={false}
                        formatText={formatProductOption}
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormTextArea
                        name={'description'}
                        label="Mô tả"
                        placeholder="Nhập mô tả"
                        rows={3}
                    />
                </Col>
                <Col md={24} xs={24}>
                    <Upload
                        multiple
                        accept="image/*"
                        customRequest={async ({ file, onSuccess, onError }) => {
                            const [err, url] = await uploadNow(file);
                            if (err) {
                                onError && onError(new Error(err));
                                return;
                            }
                            onSuccess && onSuccess({ url }, file);
                        }}
                        fileList={fileUploads}
                        onChange={({ fileList }) => setFileUploads(fileList)}
                        onRemove={(file) => {
                            const uploadUrl = file?.response?.url || file?.url;
                            if (uploadUrl) {
                                removeUploadedByUrl(uploadUrl);
                            }
                        }}
                    >
                        <Button icon={<UploadOutlined />}>Upload images</Button>
                    </Upload>
                </Col>
                <Col md={24} xs={24} style={{ marginTop: 12 }}>
                    <Space wrap>
                        {storedImages.map((url, idx) => (
                            <div key={`${url}-${idx}`} style={{ position: 'relative' }}>
                                <Image
                                    src={getStaticImageUrl(url)}
                                    alt={`stored-${idx}`}
                                    width={64}
                                    height={64}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                />
                                <Button
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    style={{ position: 'absolute', top: 0, right: 0 }}
                                    onClick={() => removeStoredImage(idx)}
                                />
                            </div>
                        ))}
                    </Space>
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text={isUpdate ? 'Update' : 'Create'} />
                </Col>
            </Row>
        </RestEditModal>
    );
};

export default DefectForm;
