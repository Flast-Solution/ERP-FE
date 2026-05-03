import { useCallback, useEffect, useRef, useState } from 'react';
import { Col, Form, Row, Typography } from 'antd';
import { SwitcherOutlined } from '@ant-design/icons';
import FormListAddition from '@/form-flast/FormListAddtion';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import FormHidden from '@/form-flast/FormHidden';
import FormInput from '@/form-flast/FormInput';
import BtnSubmit from '@flast-erp/core/components/CustomButton/BtnSubmit';
import RequestUtils, { SUCCESS_CODE } from '@flast-erp/core/utils/RequestUtils';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import DefectItem from './DefectItem';

const LIMIT = 10;

const normalizeDefects = (res) => {
  const embedded = res?.data?.embedded || res?.embedded || res?.data || [];
  return Array.isArray(embedded) ? embedded : [];
};

const AddFormListError = ({ data, closeModal }) => {
  const [form] = Form.useForm();
  const [defectOptions, setDefectOptions] = useState([]);
  const [defectLoading, setDefectLoading] = useState(false);
  const [defectHasMore, setDefectHasMore] = useState(true);
  const [keyword, setKeyword] = useState('');

  const pageRef = useRef(1);
  const totalRef = useRef(0);
  const mapRef = useRef(new Map());
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const requestedPagesRef = useRef(new Set());

  const mergeDefects = useCallback((base, incoming) => {
    const merged = [...base];
    incoming.forEach((item) => {
      const id = item?.idQcDefect;
      if (!id) return;
      mapRef.current.set(id, item);
      if (!merged.find((x) => x?.idQcDefect === id)) {
        merged.push(item);
      }
    });
    return merged;
  }, []);

  const loadDefects = useCallback(async (page = 1, append = false) => {
    if (loadingRef.current) return;
    if (append && !hasMoreRef.current) return;
    if (append && requestedPagesRef.current.has(page)) return;

    loadingRef.current = true;
    requestedPagesRef.current.add(page);
    setDefectLoading(true);
    try {
      const res = await RequestUtils.Get('/qms/qc-defect/fetch', {
        page,
        limit: LIMIT,
        ...(keyword ? { keyword } : {})
      });
      const incoming = normalizeDefects(res);
      const total = Number(
        res?.data?.page?.totalElements
        ?? res?.data?.totalElements
        ?? res?.page?.totalElements
        ?? 0
      );
      totalRef.current = Number.isNaN(total) ? 0 : total;

      const base = append ? defectOptions : [];
      const next = mergeDefects(base, incoming);
      setDefectOptions(next);

      const hasTotal = totalRef.current > 0;
      const hasMoreByTotal = hasTotal ? next.length < totalRef.current : incoming.length >= LIMIT;
      const hasNewItem = !append || next.length > base.length;
      const hasMore = hasMoreByTotal && hasNewItem && incoming.length > 0;

      hasMoreRef.current = hasMore;
      setDefectHasMore(hasMore);
      pageRef.current = page;
    } catch (error) {
      InAppEvent.normalError(error?.message || 'Không tải được danh sách lỗi');
    } finally {
      loadingRef.current = false;
      setDefectLoading(false);
    }
  }, [defectOptions, keyword, mergeDefects]);

  useEffect(() => {
    const t = setTimeout(() => {
      requestedPagesRef.current.clear();
      loadDefects(1, false);
    }, 250);
    return () => clearTimeout(t);
  }, [keyword, loadDefects]);

  const onSearchDefect = useCallback((value) => {
    setKeyword(value || '');
    pageRef.current = 1;
    totalRef.current = 0;
    hasMoreRef.current = true;
    setDefectHasMore(true);
    requestedPagesRef.current.clear();
  }, []);

  const onLoadMoreDefect = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    await loadDefects(pageRef.current + 1, true);
  }, [loadDefects]);

  const formatDefectText = useCallback((idQcDefect) => {
    const defect = mapRef.current.get(idQcDefect);
    if (!defect) return idQcDefect;
    return `${defect.defectCode || ''} - ${defect.defectName || ''}`.trim();
  }, []);

  const onSelectDefect = useCallback((index, item = {}) => {
    const fields = form.getFieldValue('defects') || [];
    fields[index] = {
      ...fields[index],
      idQcDefect: item.idQcDefect,
      defectCode: item.defectCode || '',
      defectName: item.defectName || '',
      severity: item.severity || '',
      productCode: item.productCode || '',
      description: item.description || '',
      imageUrl: item.imageUrl || ''
    };
    form.setFieldsValue({ defects: fields });
  }, [form]);

  const updateChangedDefects = useCallback(async (defects = []) => {
    const tasks = defects
      .filter((item) => item?.idQcDefect)
      .map(async (item) => {
        const original = mapRef.current.get(item.idQcDefect) || {};
        const imageUrl = item.imageUrl ?? original.imageUrl ?? '';
        const description = item.description ?? original.description ?? '';
        const isChanged = imageUrl !== (original.imageUrl ?? '') || description !== (original.description ?? '');
        if (!isChanged) return;

        await RequestUtils.Post('/qms/qc-defect/save', {
          idQcDefect: item.idQcDefect,
          defectCode: original.defectCode || item.defectCode || '',
          defectName: original.defectName || item.defectName || '',
          severity: original.severity || item.severity || '',
          productCode: original.productCode || item.productCode || '',
          imageUrl,
          description
        });
      });
    await Promise.all(tasks);
  }, []);

  const onSubmit = useCallback(async (values) => {
    const defects = Array.isArray(values?.defects) ? values.defects : [];
    const normalizedDefects = defects
      .filter((item) => item?.idQcDefect)
      .map((item) => {
        const original = mapRef.current.get(item.idQcDefect) || {};
        return {
          ...item,
          defectCode: original.defectCode || item.defectCode || '',
          defectName: original.defectName || item.defectName || '',
          severity: original.severity || item.severity || '',
          productCode: original.productCode || item.productCode || ''
        };
      });

    const param = {
      orderDetailCode: values.orderDetailCode,
      idQcInspectionResult: values.idQcInspectionResult || null,
      defects: normalizedDefects
    };

    try {
      await updateChangedDefects(normalizedDefects);
      const { errorCode } = await RequestUtils.Post('/qms/qc-defect/sync', param);
      InAppEvent.normalInfo(errorCode === SUCCESS_CODE ? 'Cập nhật thành công!' : 'Cập nhật thất bại!');
      if (errorCode === SUCCESS_CODE) {
        closeModal && closeModal();
      }
    } catch (error) {
      InAppEvent.normalError('Cập nhật thất bại!');
    }
  }, [closeModal, updateChangedDefects]);

  return (
    <RestEditModal
      isMergeRecordOnSubmit={true}
      onSubmit={onSubmit}
      record={data}
      closeModal={closeModal}
      form={form}
    >
      <Row gutter={16} style={{ marginTop: 20 }}>
        <FormHidden name={'idQcInspectionResult'} />
        <Col md={24} xs={24}>
          <FormInput
            required
            name={'orderDetailCode'}
            label="Mã tiêu chí lỗi"
            placeholder="Vd: QC-CL-001"
          />
        </Col>
        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Lỗi phát sinh</span>
          </Typography.Title>
          <FormListAddition
            name="defects"
            textAddNew="Thêm mới phát sinh"
          >
            <DefectItem
              form={form}
              defectOptions={defectOptions}
              loading={defectLoading}
              hasMore={defectHasMore}
              onSearchDefect={onSearchDefect}
              onLoadMoreDefect={onLoadMoreDefect}
              onSelectDefect={onSelectDefect}
              formatDefectText={formatDefectText}
            />
          </FormListAddition>
        </Col>
        <Col md={24} xs={24} style={{ textAlign: 'right', marginTop: 10 }}>
          <BtnSubmit text='Cập nhật' />
        </Col>
      </Row>
    </RestEditModal>
  )
};

export default AddFormListError;
