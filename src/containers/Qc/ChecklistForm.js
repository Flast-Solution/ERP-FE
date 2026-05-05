import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Row, Col } from 'antd';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormTextArea from '@flast-erp/core/components/form/FormTextArea';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';

const ChecklistForm = ({ data, closeModal }) => {
    const [criteriaData, setCriteriaData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const pageRef = useRef(1);
    const totalRef = useRef(0);

    // Giữ nguyên danh sách tiêu chí đã chọn từ data
    const selectedCriteriaList = useMemo(() => {
        if (data?.detail?.qcCriteriaList && Array.isArray(data.detail.qcCriteriaList)) {
            return data.detail.qcCriteriaList;
        }
        return data?.qcCriteriaList && Array.isArray(data.qcCriteriaList) ? data.qcCriteriaList : [];
    }, [data]);

    // Merge selected items với data từ API
    const mergeWithSelected = useCallback((apiData) => {
        const merged = [...selectedCriteriaList];
        apiData.forEach(item => {
            if (!merged.find(existing => existing.idQcCriteria === item.idQcCriteria)) {
                merged.push(item);
            }
        });
        return merged;
    }, [selectedCriteriaList]);

    // Load data lần đầu
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await QcService.fetchCriteriaPaging({
                limit: 10,
                page: 1,
                ...(searchKeyword && { keyword: searchKeyword })
            });

            if (res?.errorCode === 200) {
                const apiData = res?.data?.embedded || [];
                const totalElements = res?.data?.totalElements || 0;
                totalRef.current = totalElements;

                const mergedData = mergeWithSelected(apiData);
                setCriteriaData(mergedData);
                setHasMore(mergedData.length < totalElements);
                pageRef.current = 1;
            }
        } catch (error) {
            console.error('Error fetching criteria:', error);
        } finally {
            setLoading(false);
        }
    }, [searchKeyword, mergeWithSelected]);

    // Load thêm data khi scroll tới Waypoint
    const handleLoadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = pageRef.current + 1;
            const res = await QcService.fetchCriteriaPaging({
                limit: 10,
                page: nextPage,
                ...(searchKeyword && { keyword: searchKeyword })
            });

            if (res?.errorCode === 200) {
                const newData = res?.data?.embedded || [];
                const totalElements = res?.data?.totalElements || 0;
                totalRef.current = totalElements;

                setCriteriaData(prev => {
                    const merged = [...prev];
                    newData.forEach(item => {
                        if (!merged.find(existing => existing.idQcCriteria === item.idQcCriteria)) {
                            merged.push(item);
                        }
                    });
                    return merged;
                });

                setHasMore(criteriaData.length + newData.length < totalElements);
                pageRef.current = nextPage;
            }
        } catch (error) {
            console.error('Error loading more criteria:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, searchKeyword, criteriaData.length]);

    // Xử lý tìm kiếm
    const handleSearch = useCallback((value) => {
        setSearchKeyword(value);
        pageRef.current = 1;
        // Sẽ trigger loadInitialData qua useEffect
    }, []);

    // Effect cho search
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            loadInitialData();
        }, 300); // Debounce 300ms
        
        return () => clearTimeout(delaySearch);
    }, [searchKeyword, loadInitialData]);

    // Khởi tạo data khi component mount
    useEffect(() => {
        loadInitialData();
    }, []);

    const onSubmit = useCallback(async (values) => {
        const isUpdate = !!values.idQcCheckList;
        const res = isUpdate
            ? await QcService.updateChecklist(values)
            : await QcService.addChecklist(values);

        const isSuccess = res?.errorCode === 200;
        if (isSuccess) {
            f5List('qms/qc-check-list/fetch');
            closeModal && closeModal();
        }
        InAppEvent.normalInfo(isSuccess ? "Cập nhật thành công" : (res?.message || "Lỗi cập nhật, vui lòng thử lại sau"));
    }, []);

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={data}
            closeModal={closeModal}
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'idQcCheckList'} />
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCheckListCode'}
                        label="Mã bộ quy trình"
                        placeholder="Vd: QC-CL-001"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        required
                        name={'qcCheckListName'}
                        label="Tên bộ quy trình"
                        placeholder="Vd: Checklist kiểm tra áo sơ mi"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        name={'productTypeId'}
                        label="Loại sản phẩm"
                        placeholder="Chọn loại sản phẩm"
                        valueProp="id"
                        titleProp="name"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormInput
                        name={'version'}
                        label="Phiên bản"
                        placeholder="Vd: v1.0"
                    />
                </Col>
                <Col md={12} xs={24}>
                    <FormSelect
                        name={'isActive'}
                        label="Trạng thái"
                        resourceData={[{ id: 0, name: 'Disable' }, { id: 1, name: 'Active' }]}
                        valueProp='id'
                        titleProp='name'
                        placeholder="Chọn trạng thái"
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormSelect
                        name={'idCriteriaList'}
                        label="Danh sách quy trình"
                        placeholder="Chọn các tiêu chí"
                        mode="multiple"
                        resourceData={criteriaData}
                        valueProp="idQcCriteria"
                        titleProp="qcCriteriaName"
                        loading={loading}
                        enableWaypoint={hasMore}
                        onEnter={handleLoadMore}
                        onSearch={handleSearch}
                        showSearch
                        isFilterOption={false}
                        filterOption={false}
                        formatText={(value, record) => {
                            if (!record) return value;
                            return `${record.qcCriteriaCode} - ${record.qcCriteriaName}`;
                        }}
                    />
                </Col>
                <Col md={24} xs={24}>
                    <FormTextArea
                        name={'description'}
                        label="Mô tả"
                        placeholder="Nhập mô tả bộ quy trình"
                        rows={3}
                    />
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Hoàn thành' />
                </Col>
            </Row>
        </RestEditModal>
    );
};

export default ChecklistForm;