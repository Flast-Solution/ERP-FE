/**************************************************************************/
/*  index.js                                                           		*/
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useCallback, useState } from 'react';
import { useGetList } from "@flast-erp/core/hooks";
import { Helmet } from "react-helmet";
import { RestList, BreadcrumbCustom, CustomImage } from '@flast-erp/core/components';
import Filter from './Filter';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import { ApartmentOutlined, EyeOutlined } from '@ant-design/icons';
import { f5List, InAppEvent } from "@flast-erp/core/utils";
import { HASH_MODAL } from 'configs';
import { arrayEmpty, dateFormatOnSubmit, formatTime } from '@flast-erp/core/utils';
import ProductAttrService from '@/services/ProductAttrService';
import { cloneDeep } from 'lodash';
import SkuView, { PriceView } from '@/containers/Product/SkuView';
import { Link } from 'react-router-dom';
import WorkflowAttachModal from '@/containers/Order/List/components/WorkflowAttachModal';
import WorkflowProgressDrawer from '@/containers/Order/List/components/WorkflowProgressDrawer';
import useWorkflowModal from '@/containers/Order/List/hooks/useWorkflowModal';
import useWorkflowProgressDrawer from '@/containers/Order/List/hooks/useWorkflowProgressDrawer';
import { PRODUCT_WORKFLOW_ENTITY_TYPE } from '@/containers/Order/List/constants';
import { enrichEntitiesWithWorkflowData } from '@/containers/Order/List/services/workflowApi';
import { getProductImagePreviewUrl } from '@/containers/Product/productImages';

const PRODUCT_API_PATH = 'erp/product/fetch';

const Index = () => {

  const {
    workflowModalOpen,
    workflowLoading,
    workflowAttaching,
    workflows,
    selectedOrder,
    selectedWorkflowEntityType,
    workflowTargets,
    selectedWorkflowIdsByTarget,
    initialWorkflowIdsByTarget,
    setWorkflowIdsForTarget,
    canSubmit,
    openWorkflowModal,
    closeWorkflowModal,
    handleAttachWorkflow,
  } = useWorkflowModal({
    onAttached: () => f5List(PRODUCT_API_PATH),
  });

  const {
    workflowProgressDrawerOpen,
    workflowProgressDrawerLoading,
    workflowProgressOrder,
    workflowProgressOrderDetail,
    workflowProgressInstances,
    openWorkflowProgressDrawer,
    closeWorkflowProgressDrawer,
  } = useWorkflowProgressDrawer();

  const onEdit = (item) => {
    let title = 'Sửa sản phẩm # ' + item.id;
    let hash = '#draw/product.edit';
    let data = cloneDeep(item);
    let skus = [], listProperties = [];
    for (const property of item.listProperties || []) {
      let attr = listProperties.find(i => i.attributedId === property.attributedId);
      if (attr) {
        attr.attributedValueId.push(property.attributedValueId);
      } else {
        attr = { attributedId: property.attributedId, attributedValueId: [property.attributedValueId] }
        listProperties.push(attr);
      }
    }
    for (const iSkus of item.skus || []) {
      let item = { id: iSkus?.id, name: iSkus.name, note: iSkus?.note, skuPrices: iSkus.skuPrices || [] }
      let details = [];
      for (const detail of iSkus.skuDetails || []) {
        details.push({ id: detail?.id, attributedId: detail.attributedId, attributedValueId: detail.attributedValueId });
      }
      item.sku = details;
      skus.push(item);
    }
    data.listProperties = listProperties;
    data.skus = skus;
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onCreateProduct = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/product.edit',
    title: 'Tạo mới sản phẩm',
    data: {}
  });

  const onAddBom = (item) => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/product.bom',
    title: 'Cấu hình BOM (Bill of Materials) #' + item.id,
    data: cloneDeep(item)
  });

  const [ title ] = useState("Danh sách sản phẩm");
  const CUSTOM_ACTION = [
    {
      title: "Mã",
      dataIndex: 'code',
      width: 110,
      ellipsis: true
    },
    {
      title: "Hình ảnh",
      dataIndex: 'image',
      width: 150,
      ellipsis: true,
      render: (image) => getProductImagePreviewUrl(image) ? (
        <CustomImage
          preview={false}
          width={50}
          src={getProductImagePreviewUrl(image)}
          alt='image'
        />
      ) : ('Chưa có')
    },
    {
      title: "Sản phẩm",
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (record) => <Link to={`/product/edit/${record.id}`}>{record.name}</Link>
    },
    {
      title: "SKus",
      dataIndex: 'skus',
      width: 400,
      ellipsis: true,
      render: (skus) => <SkuView skus={skus} />
    },
    {
      title: "Giá bán",
      dataIndex: 'skus',
      width: 250,
      ellipsis: true,
      render: (skus) => <PriceView skus={skus} />
    },
    {
      title: "Created",
      dataIndex: 'createdTime',
      width: 120,
      ellipsis: true,
      render: (createdAt) => formatTime(createdAt)
    },
    {
      title: "Status",
      dataIndex: 'status',
      ellipsis: true,
      width: 120,
      render: (status) => (status || 0) === 0 ? 'Ngưng' : 'Kích hoạt'
    },
    {
      title: "",
      width: 190,
      fixed: 'right',
      render: (record) => (
        <Space gap={8}>
          <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>Detail</Button>
          <Button onClick={() => onAddBom(record)} size='small'>Bom</Button>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'attach',
                  icon: <ApartmentOutlined />,
                  label: record?.workflowInstances?.length ? 'Gắn thêm workflow' : 'Gắn workflow',
                },
                record?.workflowInstances?.length && {
                  key: 'progress',
                  icon: <EyeOutlined />,
                  label: 'Xem tiến trình',
                },
              ].filter(Boolean),
              onClick: ({ key, domEvent }) => {
                domEvent?.stopPropagation();
                if (key === 'attach') {
                  openWorkflowModal(record, PRODUCT_WORKFLOW_ENTITY_TYPE);
                }
                if (key === 'progress') {
                  openWorkflowProgressDrawer(record, record, {
                    entityName: PRODUCT_WORKFLOW_ENTITY_TYPE,
                    entityLabel: 'sản phẩm',
                  });
                }
              },
            }}
          >
            <Tooltip title={record?.workflowInstances?.length ? 'Xem tiến trình workflow' : 'Gắn workflow'}>
              <Button
                size="small"
                icon={record?.workflowInstances?.length ? <EyeOutlined /> : <ApartmentOutlined />}
                onClick={event => event.stopPropagation()}
              />
            </Tooltip>
          </Dropdown>
          {/* <Button onClick={() => onAddChecklist(record)} size='small'>Checklist</Button> */}
        </Space>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (values) => {
    if (arrayEmpty(values.embedded)) {
      return values;
    }
    let attrsId = [], attrsValuesId = [];
    for (let item of values.embedded) {
      attrsId = item.listProperties.map(i => i.attributedId).filter(i => i && i > 0);
      attrsValuesId = item.listProperties.map(i => i.attributedValueId).filter(i => i && i > 0);
    }
    ProductAttrService.loadByIds(attrsId);
    ProductAttrService.loadValueByIds(attrsValuesId);
    return enrichEntitiesWithWorkflowData(values, PRODUCT_WORKFLOW_ENTITY_TYPE);
  }, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <BreadcrumbCustom
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <RestList
        xScroll={1200}
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={PRODUCT_API_PATH}
        customClickCreate={onCreateProduct}
        columns={CUSTOM_ACTION}
      />
      <WorkflowAttachModal
        open={workflowModalOpen}
        onCancel={closeWorkflowModal}
        onOk={handleAttachWorkflow}
        confirmLoading={workflowAttaching}
        workflowTargets={workflowTargets}
        selectedWorkflowIdsByTarget={selectedWorkflowIdsByTarget}
        initialWorkflowIdsByTarget={initialWorkflowIdsByTarget}
        setWorkflowIdsForTarget={setWorkflowIdsForTarget}
        workflows={workflows}
        workflowLoading={workflowLoading}
        selectedOrder={selectedOrder}
        selectedWorkflowEntityType={selectedWorkflowEntityType}
        canSubmit={canSubmit}
        entityLabel="Sản phẩm"
      />
      <WorkflowProgressDrawer
        open={workflowProgressDrawerOpen}
        loading={workflowProgressDrawerLoading}
        order={workflowProgressOrder}
        orderDetail={workflowProgressOrderDetail}
        workflowInstances={workflowProgressInstances}
        onClose={closeWorkflowProgressDrawer}
        entityLabel="Sản phẩm"
        entityType={PRODUCT_WORKFLOW_ENTITY_TYPE}
      />
    </>
  )
}

export default Index;
