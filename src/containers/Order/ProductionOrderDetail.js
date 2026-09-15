import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Empty,
  Progress,
  Skeleton,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { HASH_MODAL } from '@/configs';
import { MANUFACTURE_STATUS_LIST_API } from '@/pages/production-control/production-order-list/constants';
import { mergeManufactureStatuses } from '@/pages/production-control/production-order-list/utils';

const Detail = styled.div`
  --detail-primary: #0f4c81;
  --detail-success: #159447;
  --detail-warning: #d97706;
  --detail-danger: #dc2626;
  --detail-border: #e5eaf0;
  --detail-muted: #667085;
  min-height: 100%;
  color: #182230;

  .detail-head {
    padding: 20px 18px;
    border-bottom: 1px solid var(--detail-border);
    background: #fff;
  }
  .detail-head-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .detail-back { padding: 0; color: var(--detail-muted); }
  .detail-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
  .detail-title { margin: 0; color: #172b4d; font-size: 22px; line-height: 1.3; }
  .detail-subtitle { margin-top: 5px; color: var(--detail-muted); font-size: 12px; }
  .detail-content { display: flex; flex-direction: column; gap: 14px; padding: 16px; }
  .detail-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid var(--detail-border); border-radius: 9px; background: #fff; }
  .detail-metric { min-width: 0; padding: 14px 16px; border-right: 1px solid #edf0f4; border-bottom: 1px solid #edf0f4; }
  .detail-metric:nth-child(2n) { border-right: 0; }
  .detail-metric:nth-last-child(-n + 2) { border-bottom: 0; }
  .detail-metric span { display: block; color: var(--detail-muted); font-size: 11px; }
  .detail-metric strong { display: block; margin-top: 4px; color: #172b4d; font-size: 22px; }
  .detail-card { overflow: hidden; border: 1px solid var(--detail-border); border-radius: 9px; background: #fff; }
  .detail-card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 15px; border-bottom: 1px solid #edf0f4; }
  .detail-card-title { margin: 0; font-size: 13px; font-weight: 750; text-transform: uppercase; letter-spacing: .035em; }
  .detail-card-body { padding: 14px 15px; }
  .detail-progress-label { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; color: var(--detail-muted); font-size: 12px; }
  .bom-list { display: flex; flex-direction: column; }
  .bom-item { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 90px; gap: 12px; align-items: center; padding: 13px 15px; border-bottom: 1px solid #edf0f4; }
  .bom-item:last-child { border-bottom: 0; }
  .bom-label { color: var(--detail-muted); font-size: 10px; }
  .bom-value { margin-top: 3px; overflow: hidden; color: #172b4d; font-size: 12px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
  .detail-table-wrap { overflow-x: auto; }
  .detail-table { width: 100%; min-width: 620px; border-collapse: collapse; font-size: 11px; }
  .detail-table th { padding: 9px 12px; color: var(--detail-muted); background: #f8fafc; text-align: left; font-size: 10px; font-weight: 650; white-space: nowrap; }
  .detail-table td { padding: 11px 12px; border-top: 1px solid #edf0f4; color: #344054; vertical-align: top; }
  .detail-table .number { text-align: right; white-space: nowrap; }
  .detail-empty { padding: 28px 16px; }
  .activity-list { display: flex; flex-direction: column; }
  .activity-item { position: relative; display: flex; gap: 11px; padding: 12px 15px; }
  .activity-item:not(:last-child):before { position: absolute; top: 29px; bottom: -1px; left: 21px; width: 1px; background: #dfe5ec; content: ''; }
  .activity-icon { position: relative; z-index: 1; flex: 0 0 auto; margin-top: 1px; color: var(--detail-success); background: #fff; font-size: 14px; }
  .activity-item.current .activity-icon { color: var(--detail-primary); }
  .activity-content strong { display: block; font-size: 12px; }
  .activity-content span { display: block; margin-top: 2px; color: var(--detail-muted); font-size: 11px; line-height: 1.45; }

  @media (max-width: 560px) {
    .detail-head-top { align-items: flex-start; }
    .detail-head-top > .ant-btn-primary { padding-inline: 10px; }
    .bom-item { grid-template-columns: 1fr; gap: 7px; }
  }
`;

const SYSTEM_STATUSES = {
  0: { name: 'Mới tạo', color: 'default' },
  1: { name: 'Đang chạy', color: 'processing' },
  2: { name: 'Hoàn thành', color: 'success' },
};

const toNumber = value => Number(value ?? 0) || 0;

const getConfirmedBomId = detail => (
  detail?.bomProductId
  ?? detail?.bomProduct?.bomProductId
  ?? detail?.bomProduct?.id
  ?? null
);

const hasConfirmedBom = detail => {
  const bomProductId = getConfirmedBomId(detail);
  return bomProductId !== null && bomProductId !== undefined && String(bomProductId).trim() !== '';
};

const getResponseItems = (response) => {
  const payload = response?.data ?? response;
  return [payload?.embedded, payload?.items, payload?.content, payload?.data, payload]
    .find(Array.isArray) ?? [];
};

const formatDate = (value) => {
  if (!value) return '-';
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const getMetrics = (record = {}) => {
  const details = record.details ?? [];
  const target = details.reduce((sum, item) => sum + toNumber(item.target), 0);
  const achieved = details.reduce((sum, item) => sum + toNumber(item.achieved), 0);
  const remaining = Math.max(target - achieved, 0);
  const progress = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : 0;
  return { target, achieved, remaining, progress };
};

const getProductName = (productId, customerOrder) => (
  (customerOrder?.details ?? []).find(item => String(item.productId) === String(productId))?.productName
  ?? `Sản phẩm #${productId}`
);

const selectBom = (versions, bomProductId) => (
  versions.find(item => String(item?.bomProductId ?? item?.id) === String(bomProductId)) ?? null
);

const ProductionOrderDetail = ({ data = {}, closeModal }) => {
  const navigate = useNavigate();
  const initialRecord = useMemo(() => data.productionOrder ?? {}, [data.productionOrder]);
  const customerOrder = useMemo(() => data.customerOrder ?? {}, [data.customerOrder]);
  const [record, setRecord] = useState(initialRecord);
  const [statuses, setStatuses] = useState([]);
  const [bomVersionsByProductId, setBomVersionsByProductId] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const params = new URLSearchParams({
          limit: '20',
          page: '1',
          code: initialRecord.code ?? '',
        });
        const [recordResult, statusResult] = await Promise.allSettled([
          RequestUtils.Get(`/erp/manufacture/fetch?${params.toString()}`, {}),
          RequestUtils.Get(MANUFACTURE_STATUS_LIST_API, { type: 'MANUFACTURE' }),
        ]);
        if (!active) return;

        const records = recordResult.status === 'fulfilled'
          ? getResponseItems(recordResult.value)
          : [];
        const detailedRecord = records.find(item => String(item.id) === String(initialRecord.id))
          ?? records.find(item => String(item.code) === String(initialRecord.code))
          ?? initialRecord;
        setRecord(detailedRecord);

        const nextStatuses = statusResult.status === 'fulfilled'
          ? mergeManufactureStatuses(statusResult.value?.data ?? [])
          : mergeManufactureStatuses();
        setStatuses(nextStatuses);

        const productIds = Array.from(new Set(
          (detailedRecord.details ?? [])
            .map(item => item.productId)
            .filter(productId => productId != null)
            .map(String),
        ));
        const bomResults = await Promise.all(productIds.map(async (productId) => {
          try {
            const response = await RequestUtils.Get(`/product-material/find-by-product/${productId}`, {});
            const items = getResponseItems(response);
            const versions = items.some(item => Array.isArray(item?.productMaterials))
              ? items
              : [{ productId, version: 'v1.0', status: 1, productMaterials: items }];
            return [productId, versions];
          } catch (error) {
            return [productId, []];
          }
        }));
        if (active) setBomVersionsByProductId(new Map(bomResults));
      } catch (error) {
        if (active) setLoadError(error?.message || 'Không tải được chi tiết lệnh sản xuất.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [initialRecord]);

  const metrics = useMemo(() => getMetrics(record), [record]);

  const bomItems = useMemo(() => (record.details ?? []).map((detail) => {
    const versions = bomVersionsByProductId.get(String(detail.productId)) ?? [];
    const persistedBom = selectBom(versions, getConfirmedBomId(detail));
    const hasLegacyConfirmation = record.confirmedBy != null
      || (Array.isArray(record.outbound) && record.outbound.length > 0);
    const bom = persistedBom
      ?? (hasLegacyConfirmation
        ? versions.find(item => Number(item?.status) === 1) ?? versions[0]
        : null);
    return {
      ...detail,
      productName: getProductName(detail.productId, customerOrder),
      bom,
      confirmed: hasConfirmedBom(detail) || Boolean(bom && hasLegacyConfirmation),
    };
  }), [bomVersionsByProductId, customerOrder, record.confirmedBy, record.details, record.outbound]);

  const materialRows = useMemo(() => {
    const rows = new Map();
    bomItems.forEach((item) => {
      (item.bom?.productMaterials ?? []).forEach((material) => {
        const materialId = material.materialId ?? material.material?.id;
        if (materialId == null) return;
        const key = String(materialId);
        const required = toNumber(material.quantity) * toNumber(item.target);
        const current = rows.get(key) ?? {
          materialId,
          name: material.material?.name ?? `Vật tư #${materialId}`,
          unit: material.material?.unit ?? material.materialUnit ?? '-',
          required: 0,
          allocated: 0,
        };
        current.required += required;
        rows.set(key, current);
      });
    });
    (record.outbound ?? []).forEach((allocation) => {
      const row = rows.get(String(allocation.materialId));
      if (row) row.allocated += toNumber(allocation.quantity);
    });
    return Array.from(rows.values()).map(row => ({
      ...row,
      readiness: row.required > 0
        ? Math.min(Math.round((row.allocated / row.required) * 100), 100)
        : 0,
    }));
  }, [bomItems, record.outbound]);

  const materialNameById = useMemo(() => new Map(
    materialRows.map(item => [String(item.materialId), item.name]),
  ), [materialRows]);

  const status = statuses.find(item => String(item.id) === String(record.status))
    ?? SYSTEM_STATUSES[record.status]
    ?? { name: `Trạng thái #${record.status}`, color: 'default' };
  const confirmedBomCount = bomItems.filter(item => item.confirmed).length;
  const allocations = Array.isArray(record.outbound) ? record.outbound : [];

  const goBack = () => {
    InAppEvent.emit(HASH_MODAL, {
      hash: '#order.production.overview',
      title: '',
      data: { customerOrder },
    });
  };

  const openProductionManagement = () => {
    closeModal?.();
    const orderCode = record.orderCode ?? customerOrder.code ?? '';
    navigate(`/material/bom?orderCode=${encodeURIComponent(orderCode)}`);
  };

  if (loading) {
    return <Detail><div className="detail-content"><Skeleton active paragraph={{ rows: 14 }} /></div></Detail>;
  }

  return (
    <Detail>
      <header className="detail-head">
        <div className="detail-head-top">
          <Button className="detail-back" type="text" icon={<ArrowLeftOutlined />} onClick={goBack}>
            Tổng quan đơn hàng
          </Button>
          <Button type="primary" icon={<SettingOutlined />} onClick={openProductionManagement}>
            Quản lý LSX
          </Button>
        </div>
        <div className="detail-title-row">
          <h1 className="detail-title">{record.code || `Lệnh sản xuất #${record.id}`}</h1>
          <Tag color={status.color || undefined}>{status.name}</Tag>
        </div>
        <div className="detail-subtitle">
          Đơn hàng {record.orderCode || customerOrder.code || '-'} · Hạn hoàn thành {formatDate(record.dateEnd)}
        </div>
      </header>

      <div className="detail-content">
        {loadError && <Alert type="warning" showIcon message="Dữ liệu chi tiết chưa đầy đủ" description={loadError} />}

        <section className="detail-metrics">
          <div className="detail-metric"><span>Số lượng mục tiêu</span><strong>{metrics.target.toLocaleString('vi-VN')}</strong></div>
          <div className="detail-metric"><span>Đã sản xuất</span><strong style={{ color: '#159447' }}>{metrics.achieved.toLocaleString('vi-VN')}</strong></div>
          <div className="detail-metric"><span>Còn lại</span><strong>{metrics.remaining.toLocaleString('vi-VN')}</strong></div>
          <div className="detail-metric"><span>Tiến độ</span><strong style={{ color: '#0f4c81' }}>{metrics.progress}%</strong></div>
        </section>

        <section className="detail-card">
          <div className="detail-card-head"><h2 className="detail-card-title">Tiến độ sản xuất</h2></div>
          <div className="detail-card-body">
            <div className="detail-progress-label"><span>Hoàn thành lệnh sản xuất</span><strong>{metrics.progress}%</strong></div>
            <Progress percent={metrics.progress} showInfo={false} strokeColor="#0f4c81" trailColor="#e7ebf0" />
          </div>
        </section>

        <section className="detail-card">
          <div className="detail-card-head">
            <h2 className="detail-card-title">Thông số BOM</h2>
            <span>{confirmedBomCount}/{bomItems.length} đã xác nhận</span>
          </div>
          {bomItems.length === 0 ? (
            <div className="detail-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm trong lệnh" /></div>
          ) : (
            <div className="bom-list">
              {bomItems.map(item => (
                <div className="bom-item" key={item.id ?? `${item.productId}-${item.sortOrder}`}>
                  <div><div className="bom-label">Sản phẩm</div><div className="bom-value">{item.productName}</div></div>
                  <div><div className="bom-label">Phiên bản BOM</div><div className="bom-value">{item.bom?.version ?? 'Chưa xác nhận'}</div></div>
                  <Tag color={item.confirmed ? 'success' : 'warning'}>
                    {item.confirmed ? 'Đã xác nhận' : 'Chưa có BOM'}
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="detail-card">
          <div className="detail-card-head"><h2 className="detail-card-title">Nhu cầu vật tư</h2></div>
          {materialRows.length === 0 ? (
            <div className="detail-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu vật tư từ BOM" /></div>
          ) : (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead><tr><th>Vật tư</th><th>Đơn vị</th><th className="number">Cần</th><th className="number">Đã phân bổ</th><th className="number">Độ sẵn sàng</th></tr></thead>
                <tbody>
                  {materialRows.map(item => (
                    <tr key={item.materialId}>
                      <td>{item.name}</td><td>{item.unit}</td>
                      <td className="number">{item.required.toLocaleString('vi-VN')}</td>
                      <td className="number">{item.allocated.toLocaleString('vi-VN')}</td>
                      <td className="number"><Tag color={item.readiness >= 100 ? 'success' : item.readiness >= 50 ? 'warning' : 'error'}>{item.readiness}%</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="detail-card">
          <div className="detail-card-head"><h2 className="detail-card-title">Phân bổ kho</h2></div>
          {allocations.length === 0 ? (
            <div className="detail-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phân bổ kho" /></div>
          ) : (
            <div className="detail-table-wrap">
              <table className="detail-table">
                <thead><tr><th>Vật tư</th><th>Kho</th><th>Vị trí</th><th className="number">Số lượng phân bổ</th></tr></thead>
                <tbody>
                  {allocations.map((item, index) => (
                    <tr key={item.id ?? index}>
                      <td>{materialNameById.get(String(item.materialId)) ?? `Vật tư #${item.materialId}`}</td>
                      <td>{item.wareHouseStock?.name ?? `Kho #${item.warehouseId}`}</td>
                      <td>{item.wareHouseStock?.address ?? '-'}</td>
                      <td className="number">{toNumber(item.quantity).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="detail-card">
          <div className="detail-card-head"><h2 className="detail-card-title">Nhật ký sản xuất</h2></div>
          <div className="activity-list">
            <div className="activity-item">
              <CheckCircleFilled className="activity-icon" />
              <div className="activity-content"><strong>Đã tạo lệnh sản xuất</strong><span>{formatDate(record.createdDate ?? record.dateStart)}</span></div>
            </div>
            {confirmedBomCount > 0 && (
              <div className="activity-item">
                <CheckCircleFilled className="activity-icon" />
                <div className="activity-content"><strong>Đã xác nhận BOM</strong><span>{confirmedBomCount}/{bomItems.length} hạng mục sản xuất</span></div>
              </div>
            )}
            {allocations.length > 0 && (
              <div className="activity-item">
                <CheckCircleFilled className="activity-icon" />
                <div className="activity-content"><strong>Đã phân bổ vật tư</strong><span>{allocations.length} lượt phân bổ kho</span></div>
              </div>
            )}
            <div className="activity-item current">
              <ClockCircleOutlined className="activity-icon" />
              <div className="activity-content"><strong>Trạng thái hiện tại: {status.name}</strong><span>Cập nhật {formatDate(record.updatedDate)}</span></div>
            </div>
          </div>
        </section>
      </div>
    </Detail>
  );
};

export default ProductionOrderDetail;
