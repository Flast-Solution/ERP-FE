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
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { InAppEvent, RequestUtils } from '@flast-erp/core/utils';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { HASH_MODAL } from '@/configs';
import { MANUFACTURE_STATUS_LIST_API } from '@/pages/production-control/production-order-list/constants';
import { mergeManufactureStatuses } from '@/pages/production-control/production-order-list/utils';

const Overview = styled.div`
  --production-primary: #0f4c81;
  --production-success: #159447;
  --production-border: #e5eaf0;
  --production-muted: #667085;
  min-height: 100%;
  color: #182230;

  .overview-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin: 0 0 20px;
    padding: 22px 24px;
    border-bottom: 1px solid var(--production-border);
    background: #fff;
  }
  .overview-eyebrow { margin-bottom: 5px; color: var(--production-muted); font-size: 12px; }
  .overview-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; }
  .overview-title { margin: 0; color: #101828; font-size: 23px; line-height: 1.25; }
  .overview-subtitle { margin-top: 6px; color: var(--production-muted); font-size: 13px; }
  .overview-layout { display: flex; flex-direction: column; gap: 18px; }
  .overview-side { display: flex; flex-direction: column; gap: 16px; }
  .overview-main { min-width: 0; }
  .overview-card {
    border: 1px solid var(--production-border);
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(16, 24, 40, .03);
  }
  .overview-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #eef1f5;
  }
  .overview-card-title { margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
  .overview-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 12px; }
  .overview-metric { padding: 11px; border-radius: 7px; background: #f7f8fb; }
  .overview-metric span { display: block; color: var(--production-muted); font-size: 11px; }
  .overview-metric strong { display: block; margin-top: 4px; color: #172b4d; font-size: 20px; }
  .overview-progress { padding: 2px 16px 15px; }
  .overview-progress-label { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
  .overview-timeline { padding: 14px 16px 18px; }
  .timeline-item { position: relative; display: flex; gap: 10px; padding-bottom: 18px; }
  .timeline-item:last-child { padding-bottom: 0; }
  .timeline-item:not(:last-child):before { position: absolute; top: 17px; bottom: 1px; left: 7px; width: 1px; background: #dfe5ec; content: ''; }
  .timeline-icon { position: relative; z-index: 1; color: #c8d0dc; background: #fff; font-size: 15px; }
  .timeline-item.done .timeline-icon { color: var(--production-success); }
  .timeline-item.current .timeline-icon { color: var(--production-primary); }
  .timeline-content strong { display: block; font-size: 12px; }
  .timeline-content span { display: block; margin-top: 2px; color: #98a2b3; font-size: 11px; }
  .overview-alert { margin-bottom: 16px; border-color: #f0d7d4; background: #fff7f6; }
  .production-list { overflow: hidden; }
  .production-count { padding: 3px 8px; border-radius: 999px; background: #eef4fb; color: #335c81; font-size: 11px; }
  .production-order { padding: 17px 18px; border-bottom: 1px solid #edf0f4; }
  .production-order { cursor: pointer; transition: background-color .2s ease, box-shadow .2s ease; }
  .production-order:hover { position: relative; z-index: 1; background: #f8fbff; box-shadow: inset 3px 0 0 var(--production-primary); }
  .production-order:focus-visible { position: relative; z-index: 1; outline: 2px solid #1677ff; outline-offset: -2px; }
  .production-order:last-child { border-bottom: 0; }
  .production-order.is-blocked { background: #fff8f7; }
  .production-order-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
  .production-order-code { color: #172b4d; font-size: 15px; font-weight: 800; }
  .production-order-product { margin-top: 4px; color: var(--production-muted); font-size: 12px; }
  .production-order-summary { flex: 0 0 auto; text-align: right; }
  .production-order-summary strong { display: block; font-size: 13px; }
  .production-order-summary span { display: block; margin-top: 3px; color: var(--production-muted); font-size: 11px; }
  .production-order-progress { display: flex; flex-direction: column; gap: 12px; margin-top: 15px; }
  .progress-caption { display: flex; justify-content: space-between; margin-bottom: 5px; color: var(--production-muted); font-size: 11px; }
  .material-readiness .ant-progress { display: block; line-height: 1; }
  .material-readiness-note { margin-top: 5px; overflow: hidden; color: #98a2b3; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
  .overview-empty { padding: 48px 20px; }

  @media (max-width: 850px) {
    .overview-head { padding: 18px 14px; }
  }
  @media (max-width: 620px) {
    .overview-head { flex-direction: column; }
  }
`;

const STATUS_FALLBACK = {
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
  const candidates = [
    payload?.embedded,
    payload?.items,
    payload?.content,
    payload?.data,
    payload,
  ];
  return candidates.find(Array.isArray) ?? [];
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

const getOrderMetrics = (productionOrders = []) => {
  const details = productionOrders.flatMap(item => item?.details ?? []);
  const target = details.reduce((sum, item) => sum + toNumber(item?.target), 0);
  const achieved = details.reduce((sum, item) => sum + toNumber(item?.achieved), 0);
  const remaining = Math.max(target - achieved, 0);
  const progress = target > 0 ? Math.min(Math.round((achieved / target) * 100), 100) : 0;
  return { target, achieved, remaining, progress };
};

const getProductionProducts = (productionOrder, order) => {
  const orderDetails = order?.details ?? [];
  const names = (productionOrder?.details ?? []).map(detail => (
    orderDetails.find(item => String(item.productId) === String(detail.productId))?.productName
      ?? `Sản phẩm #${detail.productId}`
  ));
  return Array.from(new Set(names)).join(', ') || 'Chưa có sản phẩm';
};

const getReadinessColor = (percent) => {
  if (percent == null) return '#d0d5dd';
  if (percent >= 100) return '#159447';
  if (percent >= 50) return '#f59e0b';
  return '#e5484d';
};

const calculateMaterialReadiness = ({
  productionOrder,
  detailedOrder,
  bomVersionsByProductId,
}) => {
  const requiredByMaterialId = new Map();
  let missingBom = false;
  let confirmedDetailCount = 0;

  (productionOrder?.details ?? []).forEach((detail) => {
    const confirmedBomId = getConfirmedBomId(detail);
    const productBoms = bomVersionsByProductId.get(String(detail.productId)) ?? [];
    const persistedBom = hasConfirmedBom(detail)
      ? productBoms.find(bom => (
        String(bom?.bomProductId ?? bom?.id) === String(confirmedBomId)
      ))
      : null;
    const hasLegacyConfirmation = detailedOrder?.confirmedBy != null
      || (Array.isArray(detailedOrder?.outbound) && detailedOrder.outbound.length > 0);
    const selectedBom = persistedBom
      ?? (hasLegacyConfirmation
        ? productBoms.find(bom => Number(bom?.status) === 1) ?? productBoms[0]
        : null);

    if (!selectedBom || !Array.isArray(selectedBom.productMaterials)) {
      missingBom = true;
      return;
    }
    confirmedDetailCount += 1;

    selectedBom.productMaterials.forEach((material) => {
      const materialId = material?.materialId ?? material?.material?.id;
      if (materialId == null) return;
      const requiredQuantity = toNumber(material?.quantity) * toNumber(detail?.target);
      requiredByMaterialId.set(
        String(materialId),
        (requiredByMaterialId.get(String(materialId)) ?? 0) + requiredQuantity,
      );
    });
  });

  if (missingBom) {
    return {
      percent: null,
      totalRequired: 0,
      totalAllocated: 0,
      confirmedDetailCount,
      note: 'Thiếu cấu hình BOM để tính',
    };
  }

  const totalRequired = Array.from(requiredByMaterialId.values())
    .reduce((sum, quantity) => sum + quantity, 0);
  if (totalRequired <= 0) {
    return {
      percent: null,
      totalRequired: 0,
      totalAllocated: 0,
      confirmedDetailCount,
      note: 'BOM chưa có nhu cầu vật tư',
    };
  }

  if (!Array.isArray(detailedOrder?.outbound)) {
    return {
      percent: null,
      totalRequired,
      totalAllocated: 0,
      confirmedDetailCount,
      note: 'Chưa có dữ liệu phân bổ vật tư',
    };
  }

  const allocatedByMaterialId = new Map();
  detailedOrder.outbound.forEach((allocation) => {
    if (allocation?.materialId == null) return;
    const materialId = String(allocation.materialId);
    allocatedByMaterialId.set(
      materialId,
      (allocatedByMaterialId.get(materialId) ?? 0) + toNumber(allocation.quantity),
    );
  });

  const totalAllocated = Array.from(requiredByMaterialId.entries())
    .reduce((sum, [materialId, requiredQuantity]) => (
      sum + Math.min(requiredQuantity, allocatedByMaterialId.get(materialId) ?? 0)
    ), 0);
  const percent = Math.min(Math.round((totalAllocated / totalRequired) * 100), 100);

  return {
    percent,
    totalRequired,
    totalAllocated,
    confirmedDetailCount,
    note: `${totalAllocated.toLocaleString('vi-VN')}/${totalRequired.toLocaleString('vi-VN')} vật tư đã phân bổ`,
  };
};

const ProductionOverview = ({ data = {}, closeModal }) => {
  const navigate = useNavigate();
  const customerOrder = data?.customerOrder ?? {};
  const [loading, setLoading] = useState(true);
  const [productionOrders, setProductionOrders] = useState(
    Array.isArray(customerOrder.manufactureProduct) ? customerOrder.manufactureProduct : [],
  );
  const [statuses, setStatuses] = useState([]);
  const [materialReadinessByOrderId, setMaterialReadinessByOrderId] = useState({});
  const [materialReadinessLoading, setMaterialReadinessLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const manufactureProducts = Array.isArray(customerOrder.manufactureProduct)
      ? customerOrder.manufactureProduct
      : [];

    setProductionOrders(manufactureProducts);
    setLoading(true);
    RequestUtils.Get(MANUFACTURE_STATUS_LIST_API, { type: 'MANUFACTURE' })
      .then((response) => {
        if (!active) return;
        setStatuses(mergeManufactureStatuses(response?.data ?? []));
      })
      .catch(() => {
        if (active) setStatuses(mergeManufactureStatuses());
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [customerOrder.manufactureProduct]);

  useEffect(() => {
    let active = true;
    const manufactureProducts = Array.isArray(customerOrder.manufactureProduct)
      ? customerOrder.manufactureProduct
      : [];

    if (manufactureProducts.length === 0) {
      setMaterialReadinessByOrderId({});
      setMaterialReadinessLoading(false);
      return undefined;
    }

    const loadMaterialReadiness = async () => {
      setMaterialReadinessLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '100',
          page: '1',
          orderCode: customerOrder.code ?? '',
        });
        const manufactureResponse = await RequestUtils.Get(
          `/erp/manufacture/fetch?${params.toString()}`,
          {},
        );
        const detailedOrders = getResponseItems(manufactureResponse);
        const detailedOrdersById = new Map(
          detailedOrders.map(item => [String(item.id), item]),
        );
        const mergedManufactureProducts = manufactureProducts.map((productionOrder) => {
          const detailedOrder = detailedOrdersById.get(String(productionOrder.id));
          if (!detailedOrder) return productionOrder;
          return {
            ...productionOrder,
            ...detailedOrder,
            details: Array.isArray(detailedOrder.details)
              ? detailedOrder.details
              : productionOrder.details,
          };
        });
        if (active) setProductionOrders(mergedManufactureProducts);
        const productIds = Array.from(new Set(
          mergedManufactureProducts
            .flatMap(item => item?.details ?? [])
            .map(detail => detail?.productId)
            .filter(productId => productId != null)
            .map(String),
        ));
        const bomResults = await Promise.all(productIds.map(async (productId) => {
          try {
            const response = await RequestUtils.Get(
              `/product-material/find-by-product/${productId}`,
              {},
            );
            const items = getResponseItems(response);
            const versions = items.some(item => Array.isArray(item?.productMaterials))
              ? items
              : [{ bomProductId: null, productMaterials: items }];
            return [productId, versions];
          } catch (error) {
            return [productId, []];
          }
        }));
        const bomVersionsByProductId = new Map(bomResults);
        const readiness = Object.fromEntries(mergedManufactureProducts.map(productionOrder => [
          String(productionOrder.id),
          calculateMaterialReadiness({
            productionOrder,
            detailedOrder: detailedOrdersById.get(String(productionOrder.id)),
            bomVersionsByProductId,
          }),
        ]));

        if (active) setMaterialReadinessByOrderId(readiness);
      } catch (error) {
        if (active) {
          setMaterialReadinessByOrderId(Object.fromEntries(
            manufactureProducts.map(item => [String(item.id), {
              percent: null,
              totalRequired: 0,
              totalAllocated: 0,
              confirmedDetailCount: (item?.details ?? []).filter(hasConfirmedBom).length,
              note: 'Không tải được dữ liệu vật tư',
            }]),
          ));
        }
      } finally {
        if (active) setMaterialReadinessLoading(false);
      }
    };

    loadMaterialReadiness();
    return () => { active = false; };
  }, [customerOrder.code, customerOrder.manufactureProduct]);

  const metrics = useMemo(() => getOrderMetrics(productionOrders), [productionOrders]);
  const detailCount = productionOrders.reduce((sum, item) => sum + (item?.details?.length ?? 0), 0);
  const persistedBomConfirmedCount = productionOrders.reduce((sum, item) => (
    sum + (item?.details ?? []).filter(hasConfirmedBom).length
  ), 0);
  const materialReadinessValues = Object.values(materialReadinessByOrderId);
  const evaluatedBomCount = materialReadinessValues.reduce((sum, item) => (
    sum + toNumber(item?.confirmedDetailCount)
  ), 0);
  const bomConfirmedCount = materialReadinessValues.length === productionOrders.length
    ? Math.max(persistedBomConfirmedCount, evaluatedBomCount)
    : persistedBomConfirmedCount;
  const allocationKnownOrders = materialReadinessValues.filter(item => item?.percent != null);
  const allocatedCount = allocationKnownOrders.filter(item => item.percent >= 100).length;
  const completedCount = productionOrders.filter(item => Number(item?.status) === 2).length;
  const missingBomCount = Math.max(detailCount - bomConfirmedCount, 0);
  const allCompleted = productionOrders.length > 0 && completedCount === productionOrders.length;

  const timeline = [
    { label: 'Đã nhận đơn', done: Boolean(customerOrder.id), meta: formatDate(customerOrder.createdAt) },
    { label: 'Đã tạo LSX', done: productionOrders.length > 0, meta: `${productionOrders.length} lệnh sản xuất` },
    { label: 'Xác nhận BOM', done: detailCount > 0 && bomConfirmedCount === detailCount, meta: `${bomConfirmedCount}/${detailCount} sản phẩm` },
    {
      label: 'Phân bổ vật tư',
      done: allocationKnownOrders.length > 0 && allocatedCount === allocationKnownOrders.length,
      meta: allocationKnownOrders.length > 0
        ? `${allocatedCount}/${allocationKnownOrders.length} LSX`
        : 'Chưa có dữ liệu phân bổ',
    },
    { label: 'Đang sản xuất', current: !allCompleted && productionOrders.some(item => Number(item?.status) === 1), meta: `Đã sản xuất ${metrics.achieved.toLocaleString('vi-VN')}` },
    { label: 'Hoàn thành', done: allCompleted, meta: allCompleted ? 'Đã hoàn thành' : 'Đang chờ' },
  ];

  const getStatus = (status) => {
    const configured = statuses.find(item => String(item.id) === String(status));
    return configured ?? STATUS_FALLBACK[status] ?? { name: `Trạng thái #${status}`, color: 'default' };
  };

  const openProductionManagement = () => {
    closeModal?.();
    navigate(`/material/bom?orderCode=${encodeURIComponent(customerOrder.code ?? '')}`);
  };

  const openProductionOrderDetail = (productionOrder) => {
    InAppEvent.emit(HASH_MODAL, {
      hash: '#order.production.detail',
      title: '',
      data: { productionOrder, customerOrder },
    });
  };

  return (
    <Overview>
      <header className="overview-head">
        <div>
          <div className="overview-eyebrow">Đơn hàng đang sản xuất</div>
          <div className="overview-title-row">
            <h1 className="overview-title">Đơn hàng {customerOrder.code || `#${customerOrder.id}`}</h1>
            <Tag color="processing">Đang sản xuất</Tag>
          </div>
          <div className="overview-subtitle">
            Khách hàng: {customerOrder.customerReceiverName || '-'} · Hạn: {formatDate(customerOrder.doneAt)}
          </div>
        </div>
        <Button type="primary" icon={<SettingOutlined />} onClick={openProductionManagement}>
          Quản lý lệnh sản xuất
        </Button>
      </header>

      {loading ? <Skeleton active paragraph={{ rows: 12 }} /> : (
        <div className="overview-layout">
          <aside className="overview-side">
            <section className="overview-card">
              <div className="overview-card-head"><h2 className="overview-card-title">Tổng quan sản xuất</h2></div>
              <div className="overview-metrics">
                <div className="overview-metric"><span>Tổng SL</span><strong>{metrics.target.toLocaleString('vi-VN')}</strong></div>
                <div className="overview-metric"><span>Đã SX</span><strong style={{ color: '#159447' }}>{metrics.achieved.toLocaleString('vi-VN')}</strong></div>
                <div className="overview-metric"><span>Còn lại</span><strong>{metrics.remaining.toLocaleString('vi-VN')}</strong></div>
                <div className="overview-metric"><span>Tiến độ</span><strong style={{ color: '#0f4c81' }}>{metrics.progress}%</strong></div>
              </div>
              <div className="overview-progress">
                <div className="overview-progress-label"><span>Hoàn thành tổng thể</span><strong>{metrics.progress}%</strong></div>
                <Progress percent={metrics.progress} showInfo={false} strokeColor="#0f4c81" size="small" />
              </div>
            </section>

            <section className="overview-card">
              <div className="overview-card-head"><h2 className="overview-card-title">Tiến trình</h2></div>
              <div className="overview-timeline">
                {timeline.map(item => (
                  <div className={`timeline-item${item.done ? ' done' : ''}${item.current ? ' current' : ''}`} key={item.label}>
                    {item.done
                      ? <CheckCircleFilled className="timeline-icon" />
                      : item.current
                        ? <ClockCircleOutlined className="timeline-icon" />
                        : <span className="timeline-icon">●</span>}
                    <div className="timeline-content"><strong>{item.label}</strong><span>{item.meta}</span></div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="overview-main">
            {!materialReadinessLoading && missingBomCount > 0 && (
              <Alert
                className="overview-alert"
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message="Cảnh báo chuẩn bị sản xuất"
                description={`${missingBomCount} hạng mục sản xuất chưa xác nhận BOM.`}
              />
            )}

            <section className="overview-card production-list">
              <div className="overview-card-head">
                <h2 className="overview-card-title">Danh sách lệnh sản xuất (LSX)</h2>
                <span className="production-count">{productionOrders.length} hoạt động</span>
              </div>
              {productionOrders.length === 0 ? (
                <div className="overview-empty"><Empty description="Đơn hàng chưa có lệnh sản xuất" /></div>
              ) : productionOrders.map((productionOrder) => {
                const orderMetrics = getOrderMetrics([productionOrder]);
                const status = getStatus(productionOrder.status);
                const materialReadiness = materialReadinessByOrderId[String(productionOrder.id)];
                const detailTotal = productionOrder.details?.length ?? 0;
                const hasBom = detailTotal > 0
                  && Math.max(
                    (productionOrder.details ?? []).filter(hasConfirmedBom).length,
                    toNumber(materialReadiness?.confirmedDetailCount),
                  ) === detailTotal;
                const materialReadinessPercent = materialReadiness?.percent;
                const blocked = !hasBom || materialReadinessPercent === 0;
                return (
                  <article
                    className={`production-order${blocked ? ' is-blocked' : ''}`}
                    key={productionOrder.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openProductionOrderDetail(productionOrder)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openProductionOrderDetail(productionOrder);
                      }
                    }}
                  >
                    <div className="production-order-top">
                      <div>
                        <div className="production-order-code">
                          {productionOrder.code} <Tag color={status.color || undefined}>{status.name}</Tag>
                        </div>
                        <div className="production-order-product">Sản phẩm: {getProductionProducts(productionOrder, customerOrder)}</div>
                      </div>
                      <div className="production-order-summary">
                        <strong>SL: {orderMetrics.target.toLocaleString('vi-VN')}</strong>
                        <span>Hạn: {formatDate(productionOrder.dateEnd)}</span>
                      </div>
                    </div>
                    <div className="production-order-progress">
                      <div>
                        <div className="progress-caption"><span>Tiến độ</span><strong>{orderMetrics.progress}%</strong></div>
                        <Progress percent={orderMetrics.progress} showInfo={false} strokeColor={blocked ? '#e5484d' : '#159447'} size="small" />
                      </div>
                      <div>
                        <div className="progress-caption"><span>Độ sẵn sàng vật tư</span><strong>{materialReadinessPercent == null ? '—' : `${materialReadinessPercent}%`}</strong></div>
                        <div className="material-readiness">
                          <Progress
                            percent={materialReadinessPercent ?? 0}
                            showInfo={false}
                            strokeColor={getReadinessColor(materialReadinessPercent)}
                            trailColor="#e7ebf0"
                            size="small"
                            status={materialReadinessLoading ? 'active' : 'normal'}
                          />
                          <div className="material-readiness-note">
                            {materialReadinessLoading
                              ? 'Đang tính từ BOM và phân bổ vật tư...'
                              : materialReadiness?.note ?? 'Chưa có dữ liệu vật tư'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </main>
        </div>
      )}
    </Overview>
  );
};

export default ProductionOverview;
