import React, { useCallback, useState, useEffect } from 'react';
import { Row, Col, Button, message, Tag, Select, Input, InputNumber, Form, DatePicker, Divider, Tabs, Spin, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import FormInput from '@flast-erp/core/components/form/FormInput';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import FormSelectUser from '@flast-erp/core/components/form/FormSelectUser';
import RequestUtils from '@flast-erp/core/utils/RequestUtils';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import moment from 'moment';
import styled from 'styled-components';

const StyledModal = styled.div`
    .lot-info-card {
        background: #f8f9ff;
        border: 1px solid #e8e8ff;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
    }
    .testing-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        margin-bottom: 8px;
        gap: 12px;
        &:hover {
            background: #fafafa;
        }
        .testing-name {
            flex: 1;
        }
        .testing-result {
            width: 100px;
        }
        .testing-action {
            width: 40px;
            text-align: center;
        }
    }
`;

const QcInspectionBatchForm = ({data}) => {

    const [form] = Form.useForm();
    const [testingNumbers, setTestingNumbers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Lấy danh sách order details từ data
    const orderDetails = data || [];

    // State để lưu detail đang được chọn
    const [selectedDetailIndex, setSelectedDetailIndex] = useState(0);
    const selectedDetail = orderDetails[selectedDetailIndex] || {};

    // State để lưu danh sách lô hàng đã tạo
    const [inspectionBatches, setInspectionBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [activeTab, setActiveTab] = useState('new'); // 'new' hoặc index của batch

    // State cho chế độ edit batch đã tạo
    const [editingBatch, setEditingBatch] = useState(null);
    const [editingTestingNumbers, setEditingTestingNumbers] = useState([]);
    const [activeTestingTab, setActiveTestingTab] = useState('0');
    const [activeEditingTestingTab, setActiveEditingTestingTab] = useState('0');
    const [productChecklists, setProductChecklists] = useState([]);
    const [loadingProductChecklists, setLoadingProductChecklists] = useState(false);
    const [resolvedProductCode, setResolvedProductCode] = useState(null);

    // Modal states for testing number
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [currentTestingData, setCurrentTestingData] = useState({});

    const EVALUATION_TYPE = {
        1: 'Đạt/Không đạt',
        2: 'Thang điểm',
        3: 'Định lượng',
        4: 'Mô tả'
    };

    const getEvaluationTypeLabel = (criterion) => {
        const base = EVALUATION_TYPE[criterion.evaluationType] || criterion.evaluationType || '-';
        const minScore = criterion.scaleMin ?? criterion.minScore ?? criterion.targetMin;
        const maxScore = criterion.scaleMax ?? criterion.maxScore ?? criterion.targetMax;
        const requiredMin = criterion.targetMin ?? criterion.minAcceptable ?? criterion.lowerBound;
        const unit = criterion.units ?? criterion.unit ?? criterion.measureUnit;

        if (criterion.evaluationType === 2) {
            let label = base;
            if (minScore !== undefined && maxScore !== undefined) {
                label += ` (${minScore} - ${maxScore})`;
            }
            if (requiredMin !== undefined) {
                label += ` - Yêu cầu tối thiểu: ${requiredMin}`;
            }
            return label;
        }

        if (criterion.evaluationType === 3) {
            let label = base;
            if (minScore !== undefined && maxScore !== undefined) {
                label += ` (${minScore} - ${maxScore})`;
            }
            if (unit) {
                label += ` - Đơn vị đo: ${unit}`;
            }
            return label;
        }

        return base;
    };

    useEffect(() => {
        if (testingNumbers.length === 0) {
            setActiveTestingTab('0');
        } else if (Number(activeTestingTab) >= testingNumbers.length) {
            setActiveTestingTab(String(testingNumbers.length - 1));
        }
    }, [testingNumbers.length, activeTestingTab]);

    useEffect(() => {
        if (editingTestingNumbers.length === 0) {
            setActiveEditingTestingTab('0');
        } else if (Number(activeEditingTestingTab) >= editingTestingNumbers.length) {
            setActiveEditingTestingTab(String(editingTestingNumbers.length - 1));
        }
    }, [editingTestingNumbers.length, activeEditingTestingTab]);

    const getProductCode = () => selectedDetail?.productCode || selectedDetail?.product?.code || data?.productCode || data?.product?.code || resolvedProductCode;

    const fetchProductInfoById = useCallback(async (productId) => {
        if (!productId) {
            setResolvedProductCode(null);
            return null;
        }

        try {
            const res = await RequestUtils.Get('/erp/product/find-by-id', { id: productId });
            if ((res?.errorCode === 200 || res?.errorCode === undefined) && res?.data) {
                const code = res.data?.productCode || res.data?.code || res.data?.codeProduct || null;
                setResolvedProductCode(code);
                return code;
            }
        } catch (error) {
            console.error('Error fetching product by id:', error);
        }

        setResolvedProductCode(null);
        return null;
    }, []);

    const buildCriteriaTemplate = useCallback(() => {
        return productChecklists.map(checklist => ({
            ...checklist,
            qcCriteriaList: (checklist.qcCriteriaList || []).map(item => ({
                ...item,
                inspectionResult: 1,
                comment: '',
                score: 0
            }))
        }));
    }, [productChecklists]);

    const createNewTestingNumber = () => ({
        qcTestingNumberName: '',
        overallResult: 1,
        note: '',
        isActive: 1,
        criteriaChecklist: buildCriteriaTemplate()
    });

    const buildInspectionResultPayload = (testingNumber, batchId) => {
        const idQcTestingNumber = testingNumber.idQcTestingNumber || testingNumber.id;
        return {
            idQcTestingNumber,
            inspectionCheckList: (testingNumber.criteriaChecklist || []).map(checklist => ({
                idQcChecklist: checklist.idQcCheckList || checklist.id,
                qcInspectionResultList: (checklist.qcCriteriaList || []).map(criterion => {
                    const scoreMax = criterion.scaleMax ?? criterion.maxScore ?? criterion.targetMax ?? null;
                    const unit = criterion.evaluationType === 2
                        ? (criterion.unit ?? 'điểm')
                        : (criterion.evaluationType === 3 ? (criterion.unit ?? criterion.units ?? criterion.measureUnit ?? null) : null);
                    return {
                        idQcCriteria: criterion.idQcCriteria || criterion.id,
                        idQcChecklist: checklist.idQcCheckList || checklist.id,
                        idQcInspectionBatch: batchId,
                        evaluationType: criterion.evaluationType,
                        valueBoolean: criterion.evaluationType === 1 ? (criterion.inspectionResult ?? null) : null,
                        valueScore: criterion.evaluationType === 2 ? (criterion.score ?? null) : null,
                        valueQuantity: criterion.evaluationType === 3 ? (criterion.quantity ?? criterion.valueQuantity ?? null) : null,
                        valueText: criterion.comment ?? null,
                        unit,
                        scoreAchieved: criterion.score ?? null,
                        scoreMax,
                        inspected_at: criterion.inspected_at ?? moment().format('YYYY-MM-DD HH:mm:ss')
                    };
                })
            }))
        };
    };

    const saveInspectionResults = async (batchId, testingList) => {
        if (!batchId || !Array.isArray(testingList)) return;

        for (const testingNumber of testingList) {
            const payload = buildInspectionResultPayload(testingNumber, batchId);
            try {
                await RequestUtils.Post('/qms/qc-inspection-result/save', payload);
            } catch (error) {
                console.error('Error saving inspection result:', error, payload);
            }
        }
    };

    const mergeResultsIntoCriteria = (testingNumber) => {
        const resultMap = {};
        const resultList = testingNumber.resultList || [];
        
        // Build map: idQcCriteria -> result
        resultList.forEach(result => {
            const key = `${result.idQcChecklist}-${result.idQcCriteria}`;
            resultMap[key] = result;
        });

        // Merge results into criteriaChecklist
        return (testingNumber.criteriaChecklist || []).map(checklist => ({
            ...checklist,
            qcCriteriaList: (checklist.qcCriteriaList || []).map(criterion => {
                const key = `${checklist.idQcCheckList || checklist.id}-${criterion.idQcCriteria || criterion.id}`;
                const result = resultMap[key];
                
                if (result) {
                    return {
                        ...criterion,
                        inspectionResult: result.valueBoolean ?? criterion.inspectionResult,
                        score: result.valueScore ?? criterion.score,
                        quantity: result.valueQuantity ?? criterion.quantity,
                        comment: result.valueText ?? criterion.comment,
                        unit: result.unit ?? criterion.unit,
                        scoreAchieved: result.scoreAchieved ?? criterion.scoreAchieved,
                        scoreMax: result.scoreMax ?? criterion.scoreMax,
                        inspected_at: result.inspected_at ?? criterion.inspected_at
                    };
                }
                return criterion;
            })
        }));
    };

    const loadProductChecklist = useCallback(async (productCode) => {
        if (!productCode) {
            setProductChecklists([]);
            return;
        }

        setLoadingProductChecklists(true);
        try {
            const res = await RequestUtils.Get('/qms/product-checklist/get-product', { productCode });
            if (res?.errorCode === 200) {
                const dataArray = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.embedded)
                        ? res.data.embedded
                        : Array.isArray(res?.embedded)
                            ? res.embedded
                            : [];
                setProductChecklists(dataArray);
            } else {
                setProductChecklists([]);
            }
        } catch (error) {
            console.error('Error fetching product checklist:', error);
            setProductChecklists([]);
        } finally {
            setLoadingProductChecklists(false);
        }
    }, []);

    useEffect(() => {
        const initChecklist = async () => {
            const productId = selectedDetail?.productId || data?.productId;
            const directCode = selectedDetail?.productCode || selectedDetail?.product?.code || data?.productCode || data?.product?.code;

            if (productId) {
                const code = await fetchProductInfoById(productId);
                if (code) {
                    await loadProductChecklist(code);
                    return;
                }
            }

            if (directCode) {
                setResolvedProductCode(directCode);
                await loadProductChecklist(directCode);
                return;
            }

            setResolvedProductCode(null);
            setProductChecklists([]);
        };

        initChecklist();
    }, [selectedDetail?.productCode, selectedDetail?.productId, data?.productCode, data?.productId, fetchProductInfoById, loadProductChecklist]);

    useEffect(() => {
        if (!productChecklists.length) return;
        setTestingNumbers(prev => prev.map(item => (Array.isArray(item.criteriaChecklist) && item.criteriaChecklist.length > 0) ? item : {
            ...item,
            criteriaChecklist: buildCriteriaTemplate()
        }));
        setEditingTestingNumbers(prev => prev.map(item => (Array.isArray(item.criteriaChecklist) && item.criteriaChecklist.length > 0) ? item : {
            ...item,
            criteriaChecklist: buildCriteriaTemplate()
        }));
    }, [productChecklists, buildCriteriaTemplate]);

    // Fetch inspection batches khi mở form hoặc khi chọn detail khác
    useEffect(() => {
        const fetchBatches = async () => {
            if (!selectedDetail?.orderDetailCode) return;

            setLoadingBatches(true);
            try {
                const res = await RequestUtils.Get('/qms/qc-inspection-batch/get-order-detail', {
                    orderDetailCode: selectedDetail?.orderDetailCode
                });
                if (res?.errorCode === 200 && res?.data) {
                    setInspectionBatches(res.data);
                } else {
                    setInspectionBatches([]);
                }
            } catch (error) {
                console.error('Error fetching inspection batches:', error);
                setInspectionBatches([]);
            } finally {
                setLoadingBatches(false);
            }
        };

        fetchBatches();
        // Nếu chưa có lô hàng nào thì vào tạo mới, ngược lại vào lô hàng cuối cùng
        setActiveTab('new'); // Tạm thời set 'new', sẽ update sau khi fetch xong
    }, [selectedDetail?.orderDetailCode]);

    // Set activeTab sau khi fetch batches xong
    useEffect(() => {
        if (loadingBatches) return;
        
        if (inspectionBatches.length === 0) {
            setActiveTab('new');
        } else {
            setActiveTab(`batch-${inspectionBatches.length - 1}`);
        }
    }, [inspectionBatches, loadingBatches]);

    // Initialize editing state when activeTab changes to a batch
    useEffect(() => {
        if (activeTab?.startsWith('batch-')) {
            const batchIndex = parseInt(activeTab.split('-')[1]);
            const batch = inspectionBatches[batchIndex];
            if (batch) {
                setEditingBatch({ ...batch });
                // Merge results into testing numbers
                const testingNumbersWithResults = (batch.testingNumberList || []).map(testingNumber => {
                    // Use productChecklists as base structure and merge results
                    const criteriaChecklist = productChecklists.map(checklist => ({
                        ...checklist,
                        qcCriteriaList: (checklist.qcCriteriaList || []).map(criterion => {
                            const result = (testingNumber.resultList || []).find(r => 
                                r.idQcChecklist === (checklist.idQcCheckList || checklist.id) &&
                                r.idQcCriteria === (criterion.idQcCriteria || criterion.id)
                            );
                            
                            if (result) {
                                return {
                                    ...criterion,
                                    inspectionResult: result.valueBoolean ?? criterion.inspectionResult,
                                    score: result.valueScore ?? criterion.score,
                                    quantity: result.valueQuantity ?? criterion.quantity,
                                    comment: result.valueText ?? criterion.comment,
                                    unit: result.unit ?? criterion.unit,
                                    scoreAchieved: result.scoreAchieved,
                                    scoreMax: result.scoreMax,
                                    inspected_at: result.inspected_at
                                };
                            }
                            return criterion;
                        })
                    }));
                    
                    return {
                        ...testingNumber,
                        criteriaChecklist,
                        qcTestingNumberName: testingNumber.QcTestingNumberName || testingNumber.qcTestingNumberName
                    };
                });
                setEditingTestingNumbers(testingNumbersWithResults);
            }
        } else {
            setEditingBatch(null);
            setEditingTestingNumbers([]);
        }
    }, [activeTab, inspectionBatches, productChecklists]);

    const addTestingNumber = () => {
        setModalMode('create');
        setCurrentTestingData(createNewTestingNumber());
        setIsModalVisible(true);
    };

    const removeTestingNumber = (index) => {
        setTestingNumbers(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (Number(activeTestingTab) >= next.length) {
                setActiveTestingTab(String(Math.max(0, next.length - 1)));
            }
            return next;
        });
    };

    const updateTestingNumber = (index, field, value) => {
        setTestingNumbers(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const updateTestingNumberCriterion = (testIndex, checklistIndex, criterionIndex, field, value) => {
        setTestingNumbers(prev => prev.map((item, i) => {
            if (i !== testIndex) return item;
            const criteriaChecklist = (item.criteriaChecklist || []).map((checklist, ci) => {
                if (ci !== checklistIndex) return checklist;
                return {
                    ...checklist,
                    qcCriteriaList: checklist.qcCriteriaList.map((criterion, cj) =>
                        cj === criterionIndex ? { ...criterion, [field]: value } : criterion
                    )
                };
            });
            return { ...item, criteriaChecklist };
        }));
    };

    // Functions for editing existing batch
    const startEditingBatch = (batch) => {
        setEditingBatch({ ...batch });
        // Merge results into testing numbers
        const testingNumbersWithResults = (batch.testingNumberList || []).map(testingNumber => {
            // Use productChecklists as base structure and merge results
            const criteriaChecklist = productChecklists.map(checklist => ({
                ...checklist,
                qcCriteriaList: (checklist.qcCriteriaList || []).map(criterion => {
                    const result = (testingNumber.resultList || []).find(r => 
                        r.idQcChecklist === (checklist.idQcCheckList || checklist.id) &&
                        r.idQcCriteria === (criterion.idQcCriteria || criterion.id)
                    );
                    
                    if (result) {
                        return {
                            ...criterion,
                            inspectionResult: result.valueBoolean ?? criterion.inspectionResult,
                            score: result.valueScore ?? criterion.score,
                            quantity: result.valueQuantity ?? criterion.quantity,
                            comment: result.valueText ?? criterion.comment,
                            unit: result.unit ?? criterion.unit,
                            scoreAchieved: result.scoreAchieved,
                            scoreMax: result.scoreMax,
                            inspected_at: result.inspected_at
                        };
                    }
                    return criterion;
                })
            }));
            
            return {
                ...testingNumber,
                criteriaChecklist,
                qcTestingNumberName: testingNumber.QcTestingNumberName || testingNumber.qcTestingNumberName
            };
        });
        setEditingTestingNumbers(testingNumbersWithResults);
    };

    const addEditingTestingNumber = () => {
        setModalMode('edit');
        setCurrentTestingData(createNewTestingNumber());
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        if (modalMode === 'create') {
            setTestingNumbers(prev => {
                const next = [...prev, currentTestingData];
                setActiveTestingTab(String(next.length - 1));
                return next;
            });
        } else {
            setEditingTestingNumbers(prev => {
                const next = [...prev, currentTestingData];
                setActiveEditingTestingTab(String(next.length - 1));
                return next;
            });
        }
        setIsModalVisible(false);
        setCurrentTestingData({});
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        setCurrentTestingData({});
    };

    const removeEditingTestingNumber = (index) => {
        setEditingTestingNumbers(prev => {
            const next = prev.filter((_, i) => i !== index);
            if (Number(activeEditingTestingTab) >= next.length) {
                setActiveEditingTestingTab(String(Math.max(0, next.length - 1)));
            }
            return next;
        });
    };

    const updateEditingTestingNumber = (index, field, value) => {
        setEditingTestingNumbers(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const updateEditingTestingNumberCriterion = (testIndex, checklistIndex, criterionIndex, field, value) => {
        setEditingTestingNumbers(prev => prev.map((item, i) => {
            if (i !== testIndex) return item;
            const criteriaChecklist = (item.criteriaChecklist || []).map((checklist, ci) => {
                if (ci !== checklistIndex) return checklist;
                return {
                    ...checklist,
                    qcCriteriaList: checklist.qcCriteriaList.map((criterion, cj) =>
                        cj === criterionIndex ? { ...criterion, [field]: value } : criterion
                    )
                };
            });
            return { ...item, criteriaChecklist };
        }));
    };

    const onUpdateBatch = async () => {
        if (!editingBatch) return;

        if (editingTestingNumbers.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 lần kiểm tra');
            return;
        }

        const hasEmptyName = editingTestingNumbers.some(t => !t.qcTestingNumberName);
        if (hasEmptyName) {
            message.warning('Vui lòng nhập tên cho tất cả lần kiểm tra');
            return;
        }

        const body = {
            ...editingBatch,
            testingNumberList: editingTestingNumbers
        };

        setLoading(true);
        try {
            const res = await RequestUtils.Post('/qms/qc-inspection-batch/save', body);
            const isSuccess = res?.errorCode === 200;
            if (isSuccess) {
                message.success('Cập nhật lô hàng thành công');
                
                // Refresh danh sách lô hàng
                const updatedRes = await RequestUtils.Get('/qms/qc-inspection-batch/get-order-detail', {
                    orderDetailCode: selectedDetail?.orderDetailCode
                });
                if (updatedRes?.errorCode === 200 && updatedRes?.data) {
                    setInspectionBatches(updatedRes.data);
                    const updatedBatch = updatedRes.data.find(b => b.idQcInspectionBatch === editingBatch.idQcInspectionBatch || b.id === editingBatch.id);
                    if (updatedBatch) {
                        const batchId = updatedBatch?.idQcInspectionBatch || updatedBatch?.id;
                        if (batchId && updatedBatch?.testingNumberList && editingTestingNumbers.length > 0) {
                            const mergedTestingNumbers = editingTestingNumbers.map((localTesting, index) => ({
                                ...localTesting,
                                idQcTestingNumber: updatedBatch.testingNumberList[index]?.idQcTestingNumber || updatedBatch.testingNumberList[index]?.id
                            }));
                            await saveInspectionResults(batchId, mergedTestingNumbers);
                        }
                    }
                }
                
                // Reset editing state
                // setEditingBatch(null);
                // setEditingTestingNumbers([]);
                // closeModal();
            } else {
                message.error(res?.message || 'Lỗi, vui lòng thử lại sau');
            }
        } catch (error) {
            console.error('Error updating inspection batch:', error);
            message.error('Lỗi, vui lòng thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    const onCancelEditing = () => {
        setEditingBatch(null);
        setEditingTestingNumbers([]);
    };

    const onSubmit = async (values) => {
        if (testingNumbers.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 lần kiểm tra');
            return;
        }

        const hasEmptyName = testingNumbers.some(t => !t.qcTestingNumberName);
        if (hasEmptyName) {
            message.warning('Vui lòng nhập tên cho tất cả lần kiểm tra');
            return;
        }

        const body = {
            orderDetailCode: selectedDetail?.orderDetailCode || data?.orderDetailCode,
            orderDetailId: selectedDetail?.orderDetailId,
            productCode: getProductCode(),
            name: selectedDetail?.name,
            quantity: selectedDetail?.quantity,
            skuId: selectedDetail?.skuId,
            qcInspectionBatchName: values.qcInspectionBatchName || data?.qcInspectionBatchName,
            numberProductBatch: values.numberProductBatch,
            idInspector: values.idInspector,
            inspectionDate: values.inspectionDate ? values.inspectionDate.format('YYYY-MM-DD HH:mm:ss') : moment().format('YYYY-MM-DD HH:mm:ss'),
            isActive: 1,
            testingNumberList: testingNumbers
        };

        setLoading(true);
        try {
            const res = await RequestUtils.Post('/qms/qc-inspection-batch/save', body);
            const isSuccess = res?.errorCode === 200;
            if (isSuccess) {
                f5List('/erp/order/fetch');
                message.success('Lưu lô kiểm tra thành công');
                
                // Refresh danh sách lô hàng
                const updatedRes = await RequestUtils.Get('/qms/qc-inspection-batch/get-order-detail', {
                    orderDetailCode: selectedDetail?.orderDetailCode
                });
                if (updatedRes?.errorCode === 200 && updatedRes?.data) {
                    setInspectionBatches(updatedRes.data);
                    const createdBatch = updatedRes.data[updatedRes.data.length - 1];
                    const batchId = createdBatch?.idQcInspectionBatch || createdBatch?.id;
                    if (batchId && createdBatch?.testingNumberList) {
                        // Merge local testing data with IDs from API response
                        const mergedTestingNumbers = testingNumbers.map((localTesting, index) => ({
                            ...localTesting,
                            idQcTestingNumber: createdBatch.testingNumberList[index]?.idQcTestingNumber || createdBatch.testingNumberList[index]?.id
                        }));
                        await saveInspectionResults(batchId, mergedTestingNumbers);
                    }
                    // Chuyển sang tab xem lô hàng vừa tạo
                    setActiveTab(`batch-${updatedRes.data.length - 1}`);
                }
                
                // Reset form
                setTestingNumbers([]);
                form.resetFields();
                // closeModal();
            } else {
                message.error(res?.message || 'Lỗi, vui lòng thử lại sau');
            }
        } catch (error) {
            console.error('Error saving inspection batch:', error);
            message.error('Lỗi, vui lòng thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    const recordData = {
        ...data,
        inspectionDate: moment()
    };

    return (
        <StyledModal>
            {/* <RestEditModal
                isMergeRecordOnSubmit={false}
                onSubmit={onSubmit}
                record={recordData}
                closeModal={closeModal}
                form={form}
                footer={null}
            > */}
                {/* Tabs: Danh sách lô hàng đã tạo */}
                <Form form={form} onFinish={onSubmit} layout="vertical">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    style={{ marginBottom: 16 }}
                    items={[
                        {
                            key: 'new',
                            label: 'Tạo mới'
                        },
                        ...inspectionBatches.map((batch, index) => ({
                            key: `batch-${index}`,
                            label: batch.qcInspectionBatchName || `Lô ${index + 1}`
                        }))
                    ]}
                />

                {/* Tabs content */}
                {activeTab === 'new' ? (
                    <div>
                        <Row gutter={16} style={{border: '1px solid rgb(240, 240, 240)', borderRadius: 6, padding: 10 }}>
                            <FormHidden name={'id'} />

                            <Col md={12} xs={24}>
                                <Form.Item
                                    label="Mã lô hàng"
                                    name="lotCode"
                                    rules={[{ required: true, message: 'Vui lòng nhập mã lô hàng' }]}
                                    initialValue={`LOT-${moment().format('YYYY')}-${moment().format('MMDD')}`}
                                >
                                    <Input placeholder="Vd: LOT-2026-0414" />
                                </Form.Item>
                            </Col>
                            <Col md={12} xs={24}>
                                <Form.Item
                                    label="Ngày tạo"
                                    name="createdAt"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày tạo' }]}
                                    initialValue={moment()}
                                >
                                    <DatePicker
                                        showTime={{ format: 'HH:mm' }}
                                        format="DD/MM/YYYY HH:mm"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col md={12} xs={24}>
                                <Form.Item label="Người phụ trách" name="idInspector">
                                    <FormSelectUser
                                        placeholder="Chọn người phụ trách"
                                        valueProp="id"
                                        titleProp="ssoId"
                                    />
                                </Form.Item>
                            </Col>

                            <Col md={12} xs={24}>
                                <Form.Item label="Tên lô hàng" name="qcInspectionBatchName" rules={[{ required: true, message: 'Vui lòng nhập tên lô hàng' }]}>
                                    <Input placeholder="Vd: Lô KT-04/2026 - Hộp cứng" />
                                </Form.Item>
                            </Col>

                            <Col md={24} xs={24}>
                                <Form.Item label="Ghi chú" name="note">
                                    <Input.TextArea rows={3} placeholder="Vd: Lô kiểm tra hàng nhập tháng 04/2026" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '16px 0' }} />

                        {/* Order Info Card */}
                        <div className="lot-info-card">
                            {orderDetails.length > 1 && (
                                <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                                    <Col md={24} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>CHỌN CHI TIẾT ĐƠN HÀNG</div>
                                        <Select
                                            value={selectedDetailIndex}
                                            onChange={setSelectedDetailIndex}
                                            style={{ width: '100%' }}
                                            options={orderDetails.map((detail, index) => ({
                                                label: `${detail.code} - ${detail.productName}`,
                                                value: index
                                            }))}
                                        />
                                    </Col>
                                </Row>
                            )}
                            <Row gutter={[12, 8]}>
                                <Col span={6}>
                                    <div style={{ fontSize: 11, color: '#888' }}>MÃ ĐH</div>
                                    <div style={{ fontWeight: 500 }}>{selectedDetail?.orderDetailCode || data?.code || '-'}</div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ fontSize: 11, color: '#888' }}>TÊN ĐH</div>
                                    <div style={{ fontWeight: 500 }}>{selectedDetail?.name || '-'}</div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ fontSize: 11, color: '#888' }}>SẢN PHẨM</div>
                                    <div style={{ fontWeight: 500 }}>{selectedDetail?.productName || '-'}</div>
                                </Col>
                                <Col span={6}>
                                    <div style={{ fontSize: 11, color: '#888' }}>SỐ LƯỢNG</div>
                                    <div style={{ fontWeight: 500 }}>{selectedDetail?.quantity || '-'}</div>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <strong>DANH SÁCH ĐƠN VỊ KIỂM TRA</strong>
                            <Button type="link" icon={<PlusOutlined />} onClick={addTestingNumber} style={{ padding: 0 }}>
                                Thêm đơn vị kiểm tra
                            </Button>
                        </div>

                        {testingNumbers.length > 0 ? (
                            <Tabs
                                activeKey={activeTestingTab}
                                onChange={setActiveTestingTab}
                                type="card"
                                items={testingNumbers.map((item, index) => ({
                                    key: String(index),
                                    label: item.qcTestingNumberName || `Lần ${index + 1}`,
                                    children: (
                                        <div style={{ padding: 16 }}>
                                            <div style={{ marginTop: 0 }}>
                                                <div style={{ marginBottom: 12, fontWeight: 600 }}>Bộ tiêu chí đánh giá</div>
                                                {(item.criteriaChecklist || productChecklists).map((checklist, checklistIndex) => (
                                                    <div key={checklist.idQcCheckList || checklist.id} style={{ marginBottom: 16, border: '1px solid #e8e8ff', borderRadius: 8, overflow: 'hidden' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f5f7ff', fontWeight: 600 }}>
                                                            <div>{checklist.qcCheckListCode || checklist.checkListCode || 'Bộ tiêu chí'} - {checklist.qcCheckListName || checklist.checkListName || ''}</div>
                                                            <div style={{ fontSize: 12, color: '#888' }}>({(checklist.qcCriteriaList?.length || 0)} tiêu chí)</div>
                                                        </div>
                                                        {(checklist.qcCriteriaList || []).map((criterion, criterionIndex) => (
                                                            <div key={criterion.idQcCriteria || criterion.id || criterionIndex} style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 110px 220px', gap: 12, padding: '12px 14px', borderTop: criterionIndex === 0 ? '1px solid #f0f0f0' : '1px solid #f5f5f5', alignItems: 'center' }}>
                                                                <div style={{ fontSize: 12, color: '#666' }}>{criterion.qcCriteriaCode || '--'}</div>
                                                                <div>
                                                                    <div style={{ fontWeight: 500 }}>{criterion.qcCriteriaName || '-'}</div>
                                                                    {criterion.description && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{criterion.description}</div>}
                                                                </div>
                                                                <div style={{ fontSize: 12, color: '#666' }}>{getEvaluationTypeLabel(criterion)}</div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                                                    {criterion.evaluationType === 1 ? (
                                                                        <>
                                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                                <Button
                                                                                    size="small"
                                                                                    type={criterion.inspectionResult === 1 ? 'primary' : 'default'}
                                                                                    onClick={() => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'inspectionResult', 1)}
                                                                                >
                                                                                    Đạt
                                                                                </Button>
                                                                                <Button
                                                                                    size="small"
                                                                                    type={criterion.inspectionResult === 0 ? 'primary' : 'default'}
                                                                                    onClick={() => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'inspectionResult', 0)}
                                                                                >
                                                                                    Không đạt
                                                                                </Button>
                                                                            </div>
                                                                            <Input
                                                                                value={criterion.comment || ''}
                                                                                onChange={e => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                                placeholder="Ghi chú"
                                                                                size="small"
                                                                            />
                                                                        </>
                                                                    ) : criterion.evaluationType === 2 || criterion.evaluationType === 3 ? (
                                                                        <>
                                                                            <div style={{ fontSize: 12, color: '#666' }}>
                                                                                {criterion.minScore !== undefined && criterion.maxScore !== undefined ? `Điểm: ${criterion.minScore} - ${criterion.maxScore}` : 'Điểm'}
                                                                            </div>
                                                                            <InputNumber
                                                                                value={criterion.score || 0}
                                                                                onChange={val => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'score', val)}
                                                                                size="small"
                                                                                style={{ width: '100%' }}
                                                                                placeholder="Nhập điểm"
                                                                            />
                                                                            <Input
                                                                                value={criterion.comment || ''}
                                                                                onChange={e => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                                placeholder="Ghi chú"
                                                                                size="small"
                                                                            />
                                                                        </>
                                                                    ) : (
                                                                        <Input
                                                                            value={criterion.comment || ''}
                                                                            onChange={e => updateTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                            placeholder="Ghi chú"
                                                                            size="small"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }))}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                                Chưa có đơn vị kiểm tra nào. Nhấn "Thêm đơn vị kiểm tra" để bắt đầu.
                            </div>
                        )}

                <Divider />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    {/* <Button onClick={closeModal}>Hủy bỏ</Button> */}
                    <Button type="primary" onClick={() => form.submit()} loading={loading}>
                        Tạo mới
                    </Button>
                </div>
                    </div>
                ) : (
                    <>
                        {/* Hiển thị và chỉnh sửa thông tin lô hàng đã tạo */}
                        {editingBatch && (
                            <>
                                {/* Batch Info - Editable */}
                                <Row gutter={[16, 16]} style={{border: '1px solid rgb(240, 240, 240)', borderRadius: 6, padding: 20 }}>
                                    <Col md={12} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>MÃ LÔ HÀNG</div>
                                        <Input
                                            defaultValue={editingBatch.lotCode || editingBatch.idQcInspectionBatch || ''}
                                            onChange={e => setEditingBatch({ ...editingBatch, lotCode: e.target.value })}
                                            placeholder="Vd: LOT-2026-0414"
                                        />
                                    </Col>
                                    <Col md={12} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>NGÀY TẠO</div>
                                        <DatePicker
                                            value={editingBatch.createdDate ? moment(editingBatch.createdDate) : (editingBatch.inspectionDate ? moment(editingBatch.inspectionDate) : null)}
                                            onChange={date => setEditingBatch({ ...editingBatch, createdDate: date?.format('YYYY-MM-DD HH:mm:ss') })}
                                            showTime={{ format: 'HH:mm' }}
                                            format="DD/MM/YYYY HH:mm"
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col md={12} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>NGƯỜI PHỤ TRÁCH</div>
                                        <Input
                                            defaultValue={editingBatch.idInspector || ''}
                                            onChange={e => setEditingBatch({ ...editingBatch, idInspector: e.target.value })}
                                            placeholder="ID người phụ trách"
                                        />
                                    </Col>
                                    <Col md={12} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TÊN LÔ HÀNG</div>
                                        <Input
                                            value={editingBatch.qcInspectionBatchName || ''}
                                            onChange={e => setEditingBatch({ ...editingBatch, qcInspectionBatchName: e.target.value })}
                                            placeholder="Vd: Lô KT-04/2026 - Hộp cứng"
                                        />
                                    </Col>
                                    <Col md={24} xs={24}>
                                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>GHI CHÚ</div>
                                        <Input.TextArea
                                            value={editingBatch.description || ''}
                                            onChange={e => setEditingBatch({ ...editingBatch, description: e.target.value })}
                                            rows={3}
                                            placeholder="Vd: Lô kiểm tra hàng nhập tháng 04/2026"
                                        />
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '16px 0' }} />

                                {/* Order Info Card */}
                                <div className="lot-info-card">
                                    <Row gutter={[12, 8]}>
                                        <Col span={6}>
                                            <div style={{ fontSize: 11, color: '#888' }}>MÃ ĐH</div>
                                            <div style={{ fontWeight: 500 }}>{editingBatch.orderDetailCode || '-'}</div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ fontSize: 11, color: '#888' }}>MÃ SP</div>
                                            <div style={{ fontWeight: 500 }}>{getProductCode()}</div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ fontSize: 11, color: '#888' }}>NGÀY KT</div>
                                            <div style={{ fontWeight: 500 }}>{editingBatch.inspectionDate ? moment(editingBatch.inspectionDate).format('DD/MM/YYYY HH:mm') : '-'}</div>
                                        </Col>
                                        <Col span={6}>
                                            <div style={{ fontSize: 11, color: '#888' }}>TRẠNG THÁI</div>
                                            <Tag color={editingBatch.isActive === 1 ? 'green' : 'red'} style={{ marginTop: 2 }}>
                                                {editingBatch.isActive === 1 ? 'Hoạt động' : 'Không hoạt động'}
                                            </Tag>
                                        </Col>
                                    </Row>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <strong>ĐƠN VỊ KIỂM TRA ({editingTestingNumbers.length})</strong>
                                    <Button type="link" icon={<PlusOutlined />} onClick={addEditingTestingNumber} style={{ padding: 0 }}>
                                        Thêm đơn vị kiểm tra
                                    </Button>
                                </div>

                                {editingTestingNumbers.length > 0 ? (
                                    <Tabs
                                        activeKey={activeEditingTestingTab}
                                        onChange={setActiveEditingTestingTab}
                                        type="card"
                                        items={editingTestingNumbers.map((item, index) => ({
                                            key: String(index),
                                            label: item.qcTestingNumberName || `Lần ${index + 1}`,
                                            children: (
                                                <div style={{ padding: 16 }}>
                                                    <div style={{ marginTop: 0 }}>
                                                        <div style={{ marginBottom: 12, fontWeight: 600 }}>Bộ tiêu chí đánh giá</div>
                                                        {(item.criteriaChecklist || productChecklists).map((checklist, checklistIndex) => (
                                                            <div key={checklist.idQcCheckList || checklist.id} style={{ marginBottom: 16, border: '1px solid #e8e8ff', borderRadius: 8, overflow: 'hidden' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f5f7ff', fontWeight: 600 }}>
                                                                    <div>{checklist.qcCheckListCode || checklist.checkListCode || 'Bộ tiêu chí'} - {checklist.qcCheckListName || checklist.checkListName || ''}</div>
                                                                    <div style={{ fontSize: 12, color: '#888' }}>({(checklist.qcCriteriaList?.length || 0)} tiêu chí)</div>
                                                                </div>
                                                                {(checklist.qcCriteriaList || []).map((criterion, criterionIndex) => (
                                                                    <div key={criterion.idQcCriteria || criterion.id || criterionIndex} style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 110px 220px', gap: 12, padding: '12px 14px', borderTop: criterionIndex === 0 ? '1px solid #f0f0f0' : '1px solid #f5f5f5', alignItems: 'center' }}>
                                                                        <div style={{ fontSize: 12, color: '#666' }}>{criterion.qcCriteriaCode || '--'}</div>
                                                                        <div>
                                                                            <div style={{ fontWeight: 500 }}>{criterion.qcCriteriaName || '-'}</div>
                                                                            {criterion.description && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{criterion.description}</div>}
                                                                        </div>
                                                                        <div style={{ fontSize: 12, color: '#666' }}>{getEvaluationTypeLabel(criterion)}</div>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                                                            {criterion.evaluationType === 1 ? (
                                                                                <>
                                                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                                                        <Button
                                                                                            size="small"
                                                                                            type={criterion.inspectionResult === 1 ? 'primary' : 'default'}
                                                                                            onClick={() => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'inspectionResult', 1)}
                                                                                        >
                                                                                            Đạt
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="small"
                                                                                            type={criterion.inspectionResult === 0 ? 'primary' : 'default'}
                                                                                            onClick={() => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'inspectionResult', 0)}
                                                                                        >
                                                                                            Không đạt
                                                                                        </Button>
                                                                                    </div>
                                                                                    <Input
                                                                                        value={criterion.comment || ''}
                                                                                        onChange={e => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                                        placeholder="Ghi chú"
                                                                                        size="small"
                                                                                    />
                                                                                </>
                                                                            ) : criterion.evaluationType === 2 || criterion.evaluationType === 3 ? (
                                                                                <>
                                                                                    <div style={{ fontSize: 12, color: '#666' }}>
                                                                                        {criterion.minScore !== undefined && criterion.maxScore !== undefined ? `Điểm: ${criterion.minScore} - ${criterion.maxScore}` : 'Điểm'}
                                                                                    </div>
                                                                                    <InputNumber
                                                                                        value={criterion.score || 0}
                                                                                        onChange={val => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'score', val)}
                                                                                        size="small"
                                                                                        style={{ width: '100%' }}
                                                                                        placeholder="Nhập điểm"
                                                                                        min={criterion.minScore}
                                                                                        max={criterion.maxScore}
                                                                                    />
                                                                                    <Input
                                                                                        value={criterion.comment || ''}
                                                                                        onChange={e => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                                        placeholder="Ghi chú"
                                                                                        size="small"
                                                                                    />
                                                                                </>
                                                                            ) : (
                                                                                <Input
                                                                                    value={criterion.comment || ''}
                                                                                    onChange={e => updateEditingTestingNumberCriterion(index, checklistIndex, criterionIndex, 'comment', e.target.value)}
                                                                                    placeholder="Ghi chú"
                                                                                    size="small"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        }))}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                                        Chưa có đơn vị kiểm tra nào. Nhấn "Thêm đơn vị kiểm tra" để bắt đầu.
                                    </div>
                                )}

                                <Divider />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    {/* <Button onClick={onCancelEditing}>Hủy</Button> */}
                                    <Button type="primary" onClick={onUpdateBatch} loading={loading}>
                                        Cập nhật
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </Form>
            {/* </RestEditModal> */}

            <Modal
                title="Thêm đơn vị kiểm tra"
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={handleModalCancel}
                okText="Thêm"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item label="Tên đơn vị kiểm tra">
                        <Input
                            value={currentTestingData.qcTestingNumberName || ''}
                            onChange={e => setCurrentTestingData({ ...currentTestingData, qcTestingNumberName: e.target.value })}
                            placeholder="Nhập tên đơn vị kiểm tra"
                        />
                    </Form.Item>
                    <Form.Item label="Kết quả tổng thể">
                        <Select
                            value={currentTestingData.overallResult}
                            onChange={val => setCurrentTestingData({ ...currentTestingData, overallResult: val })}
                            style={{ width: '100%' }}
                            options={[
                                { value: 1, label: <Tag color="green" style={{ margin: 0 }}>ĐẠT</Tag> },
                                { value: 0, label: <Tag color="red" style={{ margin: 0 }}>LỖI</Tag> }
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Ghi chú">
                        <Input.TextArea
                            rows={3}
                            value={currentTestingData.note || ''}
                            onChange={e => setCurrentTestingData({ ...currentTestingData, note: e.target.value })}
                            placeholder="Nhập ghi chú"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </StyledModal>
    );
};

export default QcInspectionBatchForm;




