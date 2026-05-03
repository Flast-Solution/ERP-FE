import React, { useCallback, useState, useEffect } from 'react';
import { Row, Col, Button, message, Tag, Select, Input, InputNumber, Form, DatePicker, Divider, Tabs, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import FormHidden from '@flast-erp/core/components/form/FormHidden';
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
    .criteria-row {
        display: grid;
        grid-template-columns: minmax(100px, 160px) minmax(200px, 1fr) minmax(280px, 380px) minmax(300px, 400px);
        gap: 16px;
        padding: 12px 14px;
        border-top: 1px solid #f5f5f5;
        align-items: center;

        @media (max-width: 1200px) {
            grid-template-columns: 1fr;
        }
    }
    .criteria-code {
        font-size: 12px;
        color: #666;
        font-weight: 500;
    }
    .criteria-info {
        .criteria-name {
            font-weight: 500;
            color: #262626;
            margin-bottom: 4px;
        }
        .criteria-description {
            font-size: 12px;
            color: #999;
            line-height: 1.4;
            margin-bottom: 4px;
        }
        .criteria-label {
            font-size: 11px;
            color: #666;
            display: inline-flex;
            gap: 4px;
            align-items: center;
        }
    }
    .evaluation-type {
        font-size: 12px;
        color: #666;
        padding: 4px 8px;
        background: #f5f7ff;
        border-radius: 4px;
    }
    .evaluation-inputs {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;

        .passed-failed-group {
            display: flex;
            gap: 6px;
            align-items: center;
            min-width: 170px;
        }

        .score-group {
            display: flex;
            gap: 8px;
            align-items: center;
            min-width: 260px;
            width: 100%;
        }

        .ant-input-number,
        input {
            flex: 1;
            min-width: 110px;
            width: 100%;
        }
    }
    .checklist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        background: #f5f7ff;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid #e8e8ff;

        .header-title {
            display: flex;
            gap: 8px;
            align-items: center;
            flex: 1;
        }

        .header-count {
            font-size: 12px;
            color: #666;
            font-weight: 400;
        }
    }
`;

const CriterionRow = ({ criterion, evaluationTypeMap, onUpdate, testIndex, checklistIndex, criterionIndex, defectOptions = [], defectMap = {} }) => {
    const getEvaluationTypeLabel = criterionItem => {
        const base = evaluationTypeMap[criterionItem.evaluationType] || criterionItem.evaluationType || '-';
        const minScore = criterionItem.scaleMin ?? criterionItem.minScore ?? criterionItem.targetMin;
        const maxScore = criterionItem.scaleMax ?? criterionItem.maxScore ?? criterionItem.targetMax;
        const requiredMin = criterionItem.targetMin ?? criterionItem.minAcceptable ?? criterionItem.lowerBound;
        const unit = criterionItem.units ?? criterionItem.unit ?? criterionItem.measureUnit;

        if (criterionItem.evaluationType === 2) {
            let label = base;
            if (minScore !== undefined && maxScore !== undefined) label += ` (${minScore} - ${maxScore})`;
            if (requiredMin !== undefined) label += ` - Yêu cầu tối thiểu: ${requiredMin}`;
            return label;
        }

        if (criterionItem.evaluationType === 3) {
            let label = base;
            if (minScore !== undefined && maxScore !== undefined) label += ` (${minScore} - ${maxScore})`;
            if (unit) label += ` - Đơn vị đo: ${unit}`;
            return label;
        }

        return base;
    };

    return (
        <div className="criteria-row">
            <div>
                <div className="criteria-code">{criterion.qcCriteriaCode || criterion.code || '--'}</div>
            </div>

            <div className="criteria-info">
                <div className="criteria-name">{criterion.qcCriteriaName || criterion.name || '-'}</div>
                {criterion.description && <div className="criteria-description">{criterion.description}</div>}
                <div className="criteria-label">Loại: <span className="evaluation-type">{getEvaluationTypeLabel(criterion)}</span></div>
            </div>

            <div className="evaluation-inputs">
                {criterion.evaluationType === 1 ? (
                    <>
                        <div className="passed-failed-group">
                            <Button
                                size="small"
                                type={criterion.inspectionResult === 1 ? 'primary' : 'default'}
                                onClick={() => onUpdate(testIndex, checklistIndex, criterionIndex, 'inspectionResult', 1)}
                                style={{ minWidth: '70px' }}
                            >
                                ✓ Đạt
                            </Button>
                            <Button
                                size="small"
                                danger
                                type={criterion.inspectionResult === 0 ? 'primary' : 'default'}
                                onClick={() => onUpdate(testIndex, checklistIndex, criterionIndex, 'inspectionResult', 0)}
                                style={{ minWidth: '90px' }}
                            >
                                ✗ Không đạt
                            </Button>
                        </div>
                        <Input
                            value={criterion.comment || ''}
                            onChange={e => onUpdate(testIndex, checklistIndex, criterionIndex, 'comment', e.target.value)}
                            placeholder="Ghi chú"
                            size="small"
                            style={{ minWidth: '150px' }}
                        />
                    </>
                ) : criterion.evaluationType === 2 || criterion.evaluationType === 3 ? (
                    <div className="score-group">
                        <InputNumber
                            value={criterion.evaluationType === 3 ? (criterion.quantity ?? 0) : (criterion.score ?? 0)}
                            onChange={val => onUpdate(testIndex, checklistIndex, criterionIndex, criterion.evaluationType === 3 ? 'quantity' : 'score', val)}
                            size="small"
                            placeholder={criterion.evaluationType === 3 ? 'Số lượng' : 'Điểm'}
                            min={criterion.minScore}
                            max={criterion.maxScore}
                            style={{ minWidth: '110px', width: '100%' }}
                        />
                        <Input
                            value={criterion.comment || ''}
                            onChange={e => onUpdate(testIndex, checklistIndex, criterionIndex, 'comment', e.target.value)}
                            placeholder="Ghi chú"
                            size="small"
                            style={{ minWidth: '150px', width: '100%' }}
                        />
                    </div>
                ) : (
                    <Input
                        value={criterion.comment || ''}
                        onChange={e => onUpdate(testIndex, checklistIndex, criterionIndex, 'comment', e.target.value)}
                        placeholder="Ghi chú"
                        size="small"
                        style={{ minWidth: '150px' }}
                    />
                )}
            </div>

            <div className="error-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px' }}>⚠️</span>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Thông tin lỗi</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Select
                        value={criterion.errorCode || ''}
                        onChange={val => {
                            const selectedDefect = defectMap[val] || {};
                            onUpdate(testIndex, checklistIndex, criterionIndex, 'errorCode', val);
                            onUpdate(testIndex, checklistIndex, criterionIndex, 'errorLevel', selectedDefect.severity || '');
                            onUpdate(testIndex, checklistIndex, criterionIndex, 'errorDescription', selectedDefect.description || '');
                        }}
                        placeholder="Chọn mã lỗi"
                        size="small"
                        style={{ width: '100%' }}
                        options={defectOptions || []}
                    />
                    <Input value={criterion.errorLevel ? String(criterion.errorLevel) : ''} placeholder="Mức độ" size="small" disabled />
                    <Input.TextArea value={criterion.errorDescription || ''} placeholder="Mô tả lỗi" size="small" rows={2} disabled />
                </div>
            </div>
        </div>
    );
};

const ChecklistGroup = ({ checklist, onUpdateCriterion, evaluationTypeMap, checklistNumericIndex, defectOptions, defectMap }) => (
    <div style={{ marginBottom: 20, border: '1px solid #e8e8ff', borderRadius: 8, overflow: 'hidden' }}>
        <div className="checklist-header">
            <div className="header-title">
                {checklist.qcCheckListCode || checklist.checkListCode} • {checklist.qcCheckListName || checklist.checkListName || 'Bộ tiêu chí'}
            </div>
            <div className="header-count">{checklist.qcCriteriaList?.length || 0} tiêu chí</div>
        </div>
        <div>
            {(checklist.qcCriteriaList || []).map((criterion, criterionIndex) => (
                <CriterionRow
                    key={criterion.idQcCriteria || criterion.id || criterionIndex}
                    criterion={criterion}
                    evaluationTypeMap={evaluationTypeMap}
                    onUpdate={onUpdateCriterion}
                    testIndex={0}
                    checklistIndex={checklistNumericIndex}
                    criterionIndex={criterionIndex}
                    defectOptions={defectOptions}
                    defectMap={defectMap}
                />
            ))}
        </div>
    </div>
);

const QcInspectionBatchForm = ({ data }) => {
    const [form] = Form.useForm();
    const [testingNumbers, setTestingNumbers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDetailIndex, setSelectedDetailIndex] = useState(0);
    const [inspectionBatches, setInspectionBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [activeTab, setActiveTab] = useState('new');
    const [editingBatch, setEditingBatch] = useState(null);
    const [editingTestingNumbers, setEditingTestingNumbers] = useState([]);
    const [activeTestingTab, setActiveTestingTab] = useState('0');
    const [activeEditingTestingTab, setActiveEditingTestingTab] = useState('0');
    const [productChecklists, setProductChecklists] = useState([]);
    const [resolvedProductCode, setResolvedProductCode] = useState(null);
    const [defectOptions, setDefectOptions] = useState([]);
    const [defectMap, setDefectMap] = useState({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentTestingData, setCurrentTestingData] = useState({});

    const orderDetails = data || [];
    const selectedDetail = orderDetails[selectedDetailIndex] || {};

    const EVALUATION_TYPE = useMemo(() => ({
        1: 'Đạt/Không đạt',
        2: 'Thang điểm',
        3: 'Định lượng',
        4: 'Mô tả'
    }), []);

    const loadDefects = useCallback(async (productCode) => {
        const all = [];
        let page = 1;
        const limit = 100;
        while (true) {
            const res = await RequestUtils.Get('/qms/qc-defect/fetch', { page, limit, productCode });
            const embedded = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.data?.embedded)
                    ? res.data.embedded
                    : Array.isArray(res?.embedded)
                        ? res.embedded
                        : [];
            if (!embedded.length) break;
            all.push(...embedded);
            if (embedded.length < limit || page >= 20) break;
            page += 1;
        }

        const options = all.filter(item => item?.defectCode).map(item => ({
            value: item.defectCode,
            label: `${item.defectCode} - ${item.defectName || ''}`.trim()
        }));

        const nextMap = {};
        all.forEach(item => {
            if (item?.defectCode) nextMap[item.defectCode] = item;
        });
        setDefectOptions(options);
        setDefectMap(nextMap);
    }, []);

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

    const getProductCode = useCallback(() => 
        selectedDetail?.productCode 
        || selectedDetail?.product?.code 
        || data?.productCode 
        || data?.product?.code 
        || resolvedProductCode, 
    [data, resolvedProductCode]);

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
                score: 0,
                errorCode: '',
                errorLevel: '',
                errorDescription: ''
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
                    const defectId = criterion.errorCode ? defectMap[criterion.errorCode]?.idQcDefect : null;
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
                        inspected_at: criterion.inspected_at ?? moment().format('YYYY-MM-DD HH:mm:ss'),
                        ...(defectId ? { defect: { idQcDefect: defectId } } : {})
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

    const loadProductChecklist = useCallback(async (productCode) => {
        if (!productCode) {
            setProductChecklists([]);
            return;
        }
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
        }
    }, []);

    const hydrateTestingNumberFromBatch = useCallback(testingNumber => {
        const selectedIds = normalizeCheckListIds(testingNumber.checkListIds);
        const resultMap = new Map((testingNumber.resultList || []).map(result => [`${result.idQcChecklist}-${result.idQcCriteria}`, result]));
        const criteriaChecklist = selectedIds.map(id => {
            const checklist = productChecklists.find(item => getChecklistId(item) === id);
            if (!checklist) return null;
            return {
                ...checklist,
                qcCriteriaList: (checklist.qcCriteriaList || []).map(criterion => {
                    const result = resultMap.get(`${id}-${criterion.idQcCriteria || criterion.id}`);
                    return createDraftCriterion(criterion, result ? {
                        inspectionResult: result.valueBoolean,
                        score: result.valueScore,
                        quantity: result.valueQuantity,
                        comment: result.valueText,
                        unit: result.unit,
                        scoreAchieved: result.scoreAchieved,
                        scoreMax: result.scoreMax,
                        inspected_at: result.inspected_at,
                        errorCode: result.defect?.defectCode ?? result.errorCode,
                        errorLevel: result.defect?.severity ?? result.errorLevel,
                        errorDescription: result.defect?.defectName ?? result.defect?.description ?? result.errorDescription
                    } : null);
                })
            };
        }).filter(Boolean);

        return {
            ...testingNumber,
            qcTestingNumberName: testingNumber.QcTestingNumberName || testingNumber.qcTestingNumberName,
            checkListIds: selectedIds,
            criteriaChecklist
        };
    }, [createDraftCriterion, getChecklistId, normalizeCheckListIds, productChecklists]);

    const syncDefectUpdatesFromTestingNumbers = useCallback(async (testList = []) => {
        const saveTasks = [];
        for (const testing of testList) {
            for (const checklist of (testing?.criteriaChecklist || [])) {
                for (const criterion of (checklist?.qcCriteriaList || [])) {
                    if (!criterion?.errorCode) continue;
                    const selectedDefect = defectMap[criterion.errorCode];
                    if (!selectedDefect?.idQcDefect) continue;

                    const nextDescription = criterion.errorDescription ?? selectedDefect.description ?? '';
                    const nextSeverity = criterion.errorLevel || selectedDefect.severity || '';
                    const hasChanged = nextDescription !== (selectedDefect.description || '')
                        || nextSeverity !== (selectedDefect.severity || '');
                    if (!hasChanged) continue;

                    saveTasks.push(RequestUtils.Post('/qms/qc-defect/save', {
                        idQcDefect: selectedDefect.idQcDefect,
                        defectCode: selectedDefect.defectCode || criterion.errorCode,
                        defectName: selectedDefect.defectName || '',
                        severity: nextSeverity,
                        productCode: selectedDefect.productCode || '',
                        imageUrl: selectedDefect.imageUrl || '',
                        description: nextDescription
                    }));
                }
            }
        }
        if (saveTasks.length) {
            await Promise.all(saveTasks);
            await loadDefects(getProductCode());
        }
    }, [defectMap, getProductCode, loadDefects]);

    const refreshInspectionBatches = useCallback(async orderDetailCode => {
        if (!orderDetailCode) return [];
        const res = await RequestUtils.Get('/qms/qc-inspection-batch/get-order-detail', { orderDetailCode });
        const nextBatches = res?.errorCode === 200 && Array.isArray(res?.data) ? res.data : [];
        setInspectionBatches(nextBatches);
        return nextBatches;
    }, []);

    const validateTestingList = useCallback(testList => {
        if (!testList.length) {
            message.warning('Vui lòng thêm ít nhất 1 đơn vị kiểm tra');
            return false;
        }
        if (testList.some(item => !item.qcTestingNumberName)) {
            message.warning('Vui lòng nhập tên cho tất cả đơn vị kiểm tra');
            return false;
        }
        if (testList.some(item => !normalizeCheckListIds(item.checkListIds).length)) {
            message.warning('Mỗi đơn vị kiểm tra phải chọn ít nhất 1 bộ tiêu chí');
            return false;
        }
        return true;
    }, [normalizeCheckListIds]);

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
        setTestingNumbers(prev => prev.map(item => applyChecklistSelection(item, item.checkListIds)));
        setEditingTestingNumbers(prev => prev.map(item => applyChecklistSelection(item, item.checkListIds)));
    }, [applyChecklistSelection, productChecklists]);

    useEffect(() => {
        loadDefects(getProductCode());
    }, [getProductCode, loadDefects]);

    useEffect(() => {
        const fetchBatches = async () => {
            if (!selectedDetail?.orderDetailCode) return;
            setLoadingBatches(true);
            try {
                await refreshInspectionBatches(selectedDetail.orderDetailCode);
            } catch (error) {
                console.error('Error fetching inspection batches:', error);
                setInspectionBatches([]);
            } finally {
                setLoadingBatches(false);
            }
        };

        fetchBatches();
        setActiveTab('new');
    }, [refreshInspectionBatches, selectedDetail?.orderDetailCode]);

    useEffect(() => {
        if (loadingBatches) return;
        setActiveTab(inspectionBatches.length === 0 ? 'new' : `batch-${inspectionBatches.length - 1}`);
    }, [inspectionBatches, loadingBatches]);

    useEffect(() => {
        if (!activeTab?.startsWith('batch-')) {
            setEditingBatch(null);
            setEditingTestingNumbers([]);
            return;
        }

        const batchIndex = parseInt(activeTab.split('-')[1], 10);
        const batch = inspectionBatches[batchIndex];
        if (!batch) return;

        const defectsFromResults = new Map();
        (batch.testingNumberList || []).forEach(testingNumber => {
            (testingNumber.resultList || []).forEach(result => {
                if (result.defect?.defectCode) defectsFromResults.set(result.defect.defectCode, result.defect);
            });
        });
        if (defectsFromResults.size) {
            setDefectMap(prev => {
                const next = { ...prev };
                defectsFromResults.forEach((defect, code) => {
                    next[code] = next[code] || defect;
                });
                return next;
            });
            setDefectOptions(prev => {
                const exists = new Set(prev.map(item => item.value));
                const next = [...prev];
                defectsFromResults.forEach((defect, code) => {
                    if (!exists.has(code)) {
                        next.push({ value: code, label: `${code} - ${defect.defectName || ''}`.trim() });
                    }
                });
                return next;
            });
        }

        setEditingBatch({ ...batch });
        setEditingTestingNumbers((batch.testingNumberList || []).map(hydrateTestingNumberFromBatch));
    }, [activeTab, hydrateTestingNumberFromBatch, inspectionBatches]);

    const addTestingNumber = () => {
        setModalMode('create');
        setCurrentTestingData(createNewTestingNumber());
        setIsModalVisible(true);
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

    const addEditingTestingNumber = () => {
        setModalMode('edit');
        setCurrentTestingData(createNewTestingNumber());
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        const preparedData = applyChecklistSelection(currentTestingData, currentTestingData.checkListIds);
        if (!preparedData.qcTestingNumberName) {
            message.warning('Vui lòng nhập tên đơn vị kiểm tra');
            return;
        }

        if (modalMode === 'create') {
            setTestingNumbers(prev => {
                const next = [...prev, preparedData];
                setActiveTestingTab(String(next.length - 1));
                return next;
            });
        } else {
            setEditingTestingNumbers(prev => {
                const next = [...prev, preparedData];
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

    const onSubmit = async (values) => {
        if (testingNumbers.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 lần kiểm tra');
            return;
        }

        const body = buildBatchSaveBody(null, testingNumbers, values);

        setLoading(true);
        try {
            await syncDefectUpdatesFromTestingNumbers(testingNumbers);
            const res = await RequestUtils.Post('/qms/qc-inspection-batch/save', body);
            if (res?.errorCode === 200) {
                f5List('/erp/order/fetch');
                message.success('Lưu lô kiểm tra thành công');
                const nextBatches = await refreshInspectionBatches(selectedDetail?.orderDetailCode);
                const createdBatch = nextBatches[nextBatches.length - 1];
                const batchId = createdBatch?.idQcInspectionBatch || createdBatch?.id;
                if (batchId && createdBatch?.testingNumberList) {
                    const mergedTestingNumbers = mapTestingNumbersToSavedIds(testingNumbers, createdBatch.testingNumberList);
                    await saveInspectionResults(batchId, mergedTestingNumbers);
                    await refreshInspectionBatches(selectedDetail?.orderDetailCode);
                }
                setActiveTab(`batch-${Math.max(nextBatches.length - 1, 0)}`);
                setTestingNumbers([]);
                form.resetFields();
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

    return (
        <StyledModal>
            <Form form={form} onFinish={onSubmit} layout="vertical">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    style={{ marginBottom: 16 }}
                    items={[
                        { key: 'new', label: 'Tạo mới' },
                        ...inspectionBatches.map((batch, index) => ({
                            key: `batch-${index}`,
                            label: batch.qcInspectionBatchName || `Lô ${index + 1}`
                        }))
                    ]}
                />

                {activeTab === 'new' ? (
                    <div>
                        <Row gutter={16} style={{ border: '1px solid rgb(240, 240, 240)', borderRadius: 6, padding: 10 }}>
                            <FormHidden name="id" />
                            <Col md={12} xs={24}>
                                <Form.Item label="Mã lô hàng" name="lotCode" rules={[{ required: true, message: 'Vui lòng nhập mã lô hàng' }]} initialValue={`LOT-${moment().format('YYYY')}-${moment().format('MMDD')}`}>
                                    <Input placeholder="Vd: LOT-2026-0414" />
                                </Form.Item>
                            </Col>
                            <Col md={12} xs={24}>
                                <Form.Item label="Ngày tạo" name="createdAt" rules={[{ required: true, message: 'Vui lòng chọn ngày tạo' }]} initialValue={moment()}>
                                    <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                            <Col md={12} xs={24}>
                                <Form.Item label="Người phụ trách" name="idInspector">
                                    <FormSelectUser placeholder="Chọn người phụ trách" valueProp="id" titleProp="ssoId" />
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
                                <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>MÃ ĐH</div><div style={{ fontWeight: 500 }}>{selectedDetail?.orderDetailCode || data?.code || '-'}</div></Col>
                                <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>TÊN ĐH</div><div style={{ fontWeight: 500 }}>{selectedDetail?.name || '-'}</div></Col>
                                <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>SẢN PHẨM</div><div style={{ fontWeight: 500 }}>{selectedDetail?.productName || '-'}</div></Col>
                                <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>SỐ LƯỢNG</div><div style={{ fontWeight: 500 }}>{selectedDetail?.quantity || '-'}</div></Col>
                            </Row>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <strong>DANH SÁCH ĐƠN VỊ KIỂM TRA</strong>
                            <Button type="link" icon={<PlusOutlined />} onClick={addTestingNumber} style={{ padding: 0 }}>Thêm đơn vị kiểm tra</Button>
                        </div>

                        {loadingProductChecklists ? <Spin /> : testingNumbers.length > 0 ? (
                            <Tabs
                                activeKey={activeTestingTab}
                                onChange={setActiveTestingTab}
                                type="card"
                                items={testingNumbers.map((item, index) => ({
                                    key: String(index),
                                    label: item.qcTestingNumberName || `Lần ${index + 1}`,
                                    children: renderTestingTabContent(
                                        item,
                                        value => setTestingNumbers(prev => prev.map((row, idx) => idx === index ? applyChecklistSelection(row, value) : row)),
                                        updateTestingNumberCriterion
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
                            <Button type="primary" onClick={() => form.submit()} loading={loading}>Tạo mới</Button>
                        </div>
                    </div>
                ) : (
                    editingBatch && (
                        <>
                            <Row gutter={[16, 16]} style={{ border: '1px solid rgb(240, 240, 240)', borderRadius: 6, padding: 20 }}>
                                <Col md={12} xs={24}>
                                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>MÃ LÔ HÀNG</div>
                                    <Input value={editingBatch.lotCode || editingBatch.idQcInspectionBatch || ''} onChange={e => setEditingBatch({ ...editingBatch, lotCode: e.target.value })} />
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
                                    <Input value={editingBatch.idInspector || ''} onChange={e => setEditingBatch({ ...editingBatch, idInspector: e.target.value })} />
                                </Col>
                                <Col md={12} xs={24}>
                                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TÊN LÔ HÀNG</div>
                                    <Input value={editingBatch.qcInspectionBatchName || ''} onChange={e => setEditingBatch({ ...editingBatch, qcInspectionBatchName: e.target.value })} />
                                </Col>
                                <Col md={24} xs={24}>
                                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>GHI CHÚ</div>
                                    <Input.TextArea value={editingBatch.description || ''} onChange={e => setEditingBatch({ ...editingBatch, description: e.target.value })} rows={3} />
                                </Col>
                            </Row>

                            <Divider style={{ margin: '16px 0' }} />

                            <div className="lot-info-card">
                                <Row gutter={[12, 8]}>
                                    <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>MÃ ĐH</div><div style={{ fontWeight: 500 }}>{editingBatch.orderDetailCode || '-'}</div></Col>
                                    <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>MÃ SP</div><div style={{ fontWeight: 500 }}>{getProductCode()}</div></Col>
                                    <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>NGÀY KT</div><div style={{ fontWeight: 500 }}>{editingBatch.inspectionDate ? moment(editingBatch.inspectionDate).format('DD/MM/YYYY HH:mm') : '-'}</div></Col>
                                    <Col span={6}><div style={{ fontSize: 11, color: '#888' }}>TRẠNG THÁI</div><Tag color={editingBatch.isActive === 1 ? 'green' : 'red'}>{editingBatch.isActive === 1 ? 'Hoạt động' : 'Không hoạt động'}</Tag></Col>
                                </Row>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <strong>ĐƠN VỊ KIỂM TRA ({editingTestingNumbers.length})</strong>
                                <Button type="link" icon={<PlusOutlined />} onClick={addEditingTestingNumber} style={{ padding: 0 }}>Thêm đơn vị kiểm tra</Button>
                            </div>

                            {loadingProductChecklists ? <Spin /> : editingTestingNumbers.length > 0 ? (
                                <Tabs
                                    activeKey={activeEditingTestingTab}
                                    onChange={setActiveEditingTestingTab}
                                    type="card"
                                    items={editingTestingNumbers.map((item, index) => ({
                                        key: String(index),
                                        label: item.qcTestingNumberName || `Lần ${index + 1}`,
                                        children: renderTestingTabContent(
                                            item,
                                            value => setEditingTestingNumbers(prev => prev.map((row, idx) => idx === index ? applyChecklistSelection(row, value) : row)),
                                            updateEditingTestingNumberCriterion
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
                                <Button type="primary" onClick={onUpdateBatch} loading={loading}>Cập nhật</Button>
                            </div>
                        </>
                    )
                )}
            </Form>

            <Modal title="Thêm đơn vị kiểm tra" open={isModalVisible} onOk={handleModalOk} onCancel={handleModalCancel} okText="Thêm" cancelText="Hủy">
                <Form layout="vertical">
                    <Form.Item label="Tên đơn vị kiểm tra">
                        <Input value={currentTestingData.qcTestingNumberName || ''} onChange={e => setCurrentTestingData({ ...currentTestingData, qcTestingNumberName: e.target.value })} placeholder="Nhập tên đơn vị kiểm tra" />
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
                    <Form.Item label="Bộ tiêu chí áp dụng">
                        <Select
                            mode="multiple"
                            value={normalizeCheckListIds(currentTestingData.checkListIds)}
                            onChange={value => setCurrentTestingData(prev => ({ ...prev, checkListIds: normalizeCheckListIds(value) }))}
                            style={{ width: '100%' }}
                            placeholder="Chọn bộ tiêu chí cho đơn vị kiểm tra"
                            options={checklistOptions}
                            optionFilterProp="label"
                        />
                    </Form.Item>
                    <Form.Item label="Ghi chú">
                        <Input.TextArea rows={3} value={currentTestingData.note || ''} onChange={e => setCurrentTestingData({ ...currentTestingData, note: e.target.value })} placeholder="Nhập ghi chú" />
                    </Form.Item>
                </Form>
            </Modal>
        </StyledModal>
    );
};

export default QcInspectionBatchForm;
