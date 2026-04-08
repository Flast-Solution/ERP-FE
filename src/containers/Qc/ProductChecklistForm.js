import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Row, Col, message, Table, Tag, Form } from 'antd';
import FormSelect from '@flast-erp/core/components/form/FormSelect';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import QcService from 'services/QcService';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import RequestUtils from '@flast-erp/core/utils/RequestUtils';

const LIMIT = 10;

const ProductChecklistForm = ({ data, closeModal }) => {

    const [checklistData, setChecklistData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [assignedChecklists, setAssignedChecklists] = useState([]);
    const pageRef = useRef(1);
    const totalRef = useRef(0);
    const checklistMapRef = useRef(new Map());

    // Load checklist đã gán cho sản phẩm
    const loadProductChecklist = useCallback(async (productCode) => {
        if (!productCode) return;
        try {
            const res = await RequestUtils.Get('/qms/product-checklist/get-product', { productCode });
            if (res?.errorCode === 200) {
                const dataArray = Array.isArray(res?.data) ? res.data : (res?.data?.embedded || res?.embedded || []);
                const ids = dataArray.map(item => item.idQcCheckList || item.id);

                setAssignedChecklists(dataArray);

                // Đưa checklist đã chọn vào map
                dataArray.forEach(item => {
                    const id = item.idQcCheckList || item.id;
                    checklistMapRef.current.set(id, { ...item, idQcCheckList: id });
                });
            }
        } catch (error) {
            console.error('Error fetching product checklist:', error);
        }
    }, []);

    // Load data lần đầu
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await QcService.fetchChecklist({
                limit: LIMIT,
                page: 1,
                ...(searchKeyword && { keyword: searchKeyword })
            });

            if (res?.errorCode === 200) {
                const apiData = res?.data?.embedded || [];
                const totalElements = res?.data?.totalElements || 0;
                totalRef.current = totalElements;

                apiData.forEach(item => {
                    checklistMapRef.current.set(item.idQcCheckList, item);
                });

                // Merge với assignedChecklists để hiển thị item đã chọn
                const merged = [...assignedChecklists];
                apiData.forEach(item => {
                    if (!merged.find(a => a.idQcCheckList === item.idQcCheckList)) {
                        merged.push(item);
                    }
                });

                setChecklistData(merged);
                setHasMore(merged.length < totalElements + assignedChecklists.length);
                pageRef.current = 1;
            }
        } catch (error) {
            console.error('Error fetching checklist:', error);
        } finally {
            setLoading(false);
        }
    }, [searchKeyword, assignedChecklists]);

    // Load thêm data khi scroll tới Waypoint
    const handleLoadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const nextPage = pageRef.current + 1;
            const res = await QcService.fetchChecklist({
                limit: LIMIT,
                page: nextPage,
                ...(searchKeyword && { keyword: searchKeyword })
            });

            if (res?.errorCode === 200) {
                const newData = res?.data?.embedded || [];
                const totalElements = res?.data?.totalElements || 0;
                totalRef.current = totalElements;

                newData.forEach(item => {
                    checklistMapRef.current.set(item.idQcCheckList, item);
                });

                setChecklistData(prev => {
                    const merged = [...prev];
                    newData.forEach(item => {
                        if (!merged.find(existing => existing.idQcCheckList === item.idQcCheckList)) {
                            merged.push(item);
                        }
                    });
                    return merged;
                });

                setHasMore(checklistData.length + newData.length < totalElements);
                pageRef.current = nextPage;
            }
        } catch (error) {
            console.error('Error loading more checklist:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, searchKeyword, checklistData.length]);

    // Xử lý tìm kiếm
    const handleSearch = useCallback((value) => {
        setSearchKeyword(value);
        pageRef.current = 1;
    }, []);

    // Effect cho search
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            loadInitialData();
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchKeyword, loadInitialData, assignedChecklists]);

    // Khởi tạo data khi component mount
    useEffect(() => {
        const productCode = data?.code;
        const init = async () => {
            await loadProductChecklist(productCode);
            await loadInitialData();
        };
        init();
    }, []);

    const onSubmit = useCallback(async (values) => {
        const productCode = data?.code;
        const checklistIds = values.idCheckList || [];

        if (checklistIds.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 bộ tiêu chí');
            return;
        }

        if (!productCode) {
            message.error('Không tìm thấy mã sản phẩm');
            return;
        }

        const res = await RequestUtils.Post('/qms/product-checklist/save', {
            productCode,
            checkListIds: checklistIds
        });

        const isSuccess = res?.errorCode === 200;
        if (isSuccess) {
            f5List('/erp/product/fetch');
            closeModal && closeModal();
        }
        InAppEvent.normalInfo(isSuccess ? 'Gán bộ tiêu chí thành công' : (res?.message || 'Lỗi, vui lòng thử lại sau'));
    }, [data, closeModal]);

    const formatChecklistLabel = useCallback((value) => {
        const record = checklistMapRef.current.get(value);
        if (!record) return value;
        return `${record.qcCheckListCode} - ${record.qcCheckListName}`;
    }, []);

    const EVALUATION_TYPE = {
        0: 'Không đánh giá',
        1: 'Định tính',
        2: 'Định lượng',
        3: 'Số liệu'
    };

    const criteriaColumns = [
        {
            title: 'Mã tiêu chí',
            dataIndex: 'qcCriteriaCode',
            width: 150,
            ellipsis: true
        },
        {
            title: 'Tên tiêu chí',
            dataIndex: 'qcCriteriaName',
            ellipsis: true
        },
        {
            title: 'Loại đánh giá',
            dataIndex: 'evaluationType',
            width: 130,
            render: (type) => EVALUATION_TYPE[type] || type || '-'
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            width: 120,
            render: (isActive) => (
                <Tag color={isActive === 1 ? 'green' : 'red'}>
                    {isActive === 1 ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
            )
        }
    ];

    const recordData = { ...data };
    if (assignedChecklists.length > 0) {
        recordData.idCheckList = assignedChecklists.map(item => item.idQcCheckList || item.id);
    }

    return (
        <RestEditModal
            isMergeRecordOnSubmit={true}
            onSubmit={onSubmit}
            record={recordData}
            closeModal={closeModal}
        >
            <Row gutter={16} style={{ marginTop: 20 }}>
                <FormHidden name={'id'} />
                <Col md={24} xs={24}>
                    <FormSelect
                        name={'idCheckList'}
                        label="Danh sách bộ tiêu chí QC"
                        placeholder="Chọn các bộ tiêu chí"
                        mode="multiple"
                        resourceData={checklistData}
                        valueProp="idQcCheckList"
                        titleProp="qcCheckListName"
                        loading={loading}
                        enableWaypoint={hasMore}
                        onEnter={handleLoadMore}
                        onSearch={handleSearch}
                        showSearch
                        isFilterOption={false}
                        filterOption={false}
                        formatText={formatChecklistLabel}
                    />
                </Col>
                <Col md={24} xs={24}>
                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.idCheckList !== curr.idCheckList}>
                        {({ getFieldValue }) => {
                            const ids = getFieldValue('idCheckList') || [];
                            const selectedChecklists = ids
                                .map(id => checklistMapRef.current.get(id))
                                .filter(Boolean)
                                .filter(c => c?.qcCriteriaList && c.qcCriteriaList.length > 0);

                            if (selectedChecklists.length === 0) return null;

                            return (
                                <div style={{ marginTop: 16 }}>
                                    {selectedChecklists.map(checklist => (
                                        <div key={checklist.idQcCheckList} style={{ marginBottom: 16 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: 14,
                                                padding: '8px 12px',
                                                background: '#f5f5f5',
                                                borderRadius: '4px 4px 0 0',
                                                border: '1px solid #e8e8e8',
                                                borderBottom: 'none'
                                            }}>
                                                {checklist.qcCheckListCode} - {checklist.qcCheckListName}
                                                <span style={{
                                                    float: 'right',
                                                    fontWeight: 400,
                                                    fontSize: 12,
                                                    color: '#888'
                                                }}>
                                                    ({checklist.qcCriteriaList.length} tiêu chí)
                                                </span>
                                            </div>
                                            <Table
                                                dataSource={checklist.qcCriteriaList}
                                                columns={criteriaColumns}
                                                rowKey="idQcCriteria"
                                                size="small"
                                                pagination={false}
                                                scroll={{ y: 150 }}
                                                style={{ borderRadius: '0 0 4px 4px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            );
                        }}
                    </Form.Item>
                </Col>
                <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
                    <BtnSubmit text='Hoàn thành' />
                </Col>
            </Row>
        </RestEditModal>
    );
};

export default ProductChecklistForm;
