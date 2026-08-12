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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { RestList, BreadcrumbCustom, FormSelect, NoFooter } from '@flast-erp/core/components';
import { ApartmentOutlined, EyeOutlined, InfoCircleOutlined, SelectOutlined, UserAddOutlined } from '@ant-design/icons';
import LeadFilter from './LeadFilter';
import { useGetList } from "@flast-erp/core/hooks";
import { Button, Dropdown, Form, Tag, Tooltip } from 'antd';
import { RequestUtils, dateFormatOnSubmit, f5List } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs';
import { InAppEvent } from '@flast-erp/core/utils';
import { cloneDeep } from 'lodash';
import ModaleStyles from './style';
import { useNavigate } from "react-router-dom";
import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData';
import WorkflowAttachModal from '@/containers/Order/List/components/WorkflowAttachModal';
import useWorkflowModal from '@/containers/Order/List/hooks/useWorkflowModal';
import { LEAD_WORKFLOW_ENTITY_TYPE } from '@/containers/Order/List/constants';
import { enrichEntitiesWithWorkflowData } from '@/containers/Order/List/services/workflowApi';
import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext';
import LeadDetailDrawer from './LeadDetailDrawer';

const LEAD_API_PATH = 'data/lists';

const getLeadIdFromHash = () => {
  if (typeof window === 'undefined') return null;
  return window.location.hash.match(/^#(\d+)$/)?.[1] ?? null;
};

const replaceLeadHash = (leadId) => {
  if (typeof window === 'undefined') return;
  const hash = leadId ? `#${leadId}` : '';
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}${hash}`,
  );
};

const LeadPage = () => {

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
    onAttached: () => f5List(LEAD_API_PATH),
  });

  const { openWorkflowDrawer } = useWorkflowDrawer();

  const [form] = Form.useForm();
  const [title] = useState("Danh sách Lead");
  const [listSale, setListSale] = useState([]);
  const [detailRecord, setDetailRecord] = useState({});
  const [detailLead, setDetailLead] = useState(null);
  const [listServices, setlistServices] = useState([])
  const leadRowsRef = useRef([]);

  useEffect(() => {
    RequestUtils.GetAsList('/service/list').then(setlistServices);
    RequestUtils.GetAsList('/user/list-name-id').then(setListSale);
  }, [])

  useEffect(() => {
    form.setFieldsValue({ saleId: detailRecord?.saleId })
  }, [form, detailRecord])

  useEffect(() => {
    const syncDetailLeadFromHash = () => {
      const leadId = getLeadIdFromHash();
      if (!leadId) {
        setDetailLead(null);
        return;
      }
      const matchedLead = leadRowsRef.current.find(item => String(item?.id) === leadId);
      setDetailLead(matchedLead ?? null);
    };

    window.addEventListener('hashchange', syncDetailLeadFromHash);
    window.addEventListener('popstate', syncDetailLeadFromHash);
    return () => {
      window.removeEventListener('hashchange', syncDetailLeadFromHash);
      window.removeEventListener('popstate', syncDetailLeadFromHash);
    };
  }, []);

  const openLeadDetail = useCallback((record) => {
    setDetailLead(record);
    replaceLeadHash(record?.id);
  }, []);

  const closeLeadDetail = useCallback(() => {
    setDetailLead(null);
    if (getLeadIdFromHash()) replaceLeadHash(null);
  }, []);

  const onEdit = (item) => {
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, {
      hash: '#draw/lead.edit',
      title: 'Cập nhật lead #' + item.id,
      data: {
        record: data,
        listServices,
        listSale
      }
    });
  }

  let navigate = useNavigate();
  const onCreateOpportunity = useCallback(({ id }) => {
    navigate(RequestUtils.generateUrlGetParams("/sale/ban-hang", { dataId: id }));
  }, [navigate]);

  const CUSTOM_ACTION = [
    {
      title: "Create",
      dataIndex: 'staff',
      width: 150
    },
    {
      title: "Khách hàng",
      dataIndex: 'customerName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Số đ/t",
      dataIndex: 'customerMobile',
      width: 120,
      ellipsis: true
    },
    {
      title: "Dịch vụ",
      dataIndex: 'serviceId',
      width: 150,
      ellipsis: true,
      render: (serviceId) => {
        const nameService = listServices.find(f => f.id === serviceId)
        return <Tag color="orange">{nameService?.name || 'N/A'} </Tag>
      }
    },
    {
      title: "Nguồn",
      dataIndex: 'source',
      width: 170,
      render: (source) => CHANNEL_SOURCE_MAP_KEYS[source]?.name
    },
    {
      title: "Sản phẩm",
      dataIndex: 'productName',
      width: 200,
      ellipsis: true
    },
    {
      title: "Ngày",
      dataIndex: 'inTime',
      width: 150,
      ellipsis: true,
      render: (inTime) => dateFormatOnSubmit(inTime)
    },
    {
      title: "Sale",
      dataIndex: 'assignTo',
      width: 100,
      ellipsis: true
    },
    {
      title: "Cơ hội",
      width: 100,
      fixed: 'right',
      render: (record) => (
        <Button
          color="danger"
          variant="dashed" onClick={() => onCreateOpportunity(record)}
          size='small'
        >
          Tạo cơ hội
        </Button>
      )
    },
    {
      title: "Thao tác",
      width: 170,
      fixed: 'right',
      ellipsis: true,
      render: (record) => (
        <div style={{ display: 'flex', gap: 20 }}>
          <Tooltip style={{ cursor: 'pointer' }} title="Chuyển sale">
            <UserAddOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => {
              setDetailRecord(record)
            }} />
          </Tooltip>
          <Tooltip style={{ cursor: 'pointer' }} title={'Cập nhật'}>
            <SelectOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip style={{ cursor: 'pointer' }} title="Xem chi tiết Lead">
            <InfoCircleOutlined style={{ color: '#7c3aed', fontSize: 16 }} onClick={() => openLeadDetail(record)} />
          </Tooltip>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'attach-workflow',
                  icon: <ApartmentOutlined />,
                  label: record?.workflowInstances?.length ? 'Gắn thêm workflow' : 'Gắn workflow',
                },
                record?.workflowInstances?.length ? {
                  key: 'workflow-progress',
                  icon: <EyeOutlined />,
                  label: 'Xem tiến trình',
                } : null,
              ].filter(Boolean),
              onClick: ({ key, domEvent }) => {
                domEvent?.stopPropagation();
                if (key === 'attach-workflow') {
                  openWorkflowModal(record, LEAD_WORKFLOW_ENTITY_TYPE, { flowType: 'LEAD' });
                }
                if (key === 'workflow-progress') {
                  openWorkflowDrawer(record, record, {
                    entityName: LEAD_WORKFLOW_ENTITY_TYPE,
                    entityLabel: 'Lead',
                  });
                }
              },
            }}
          >
            <Tooltip title={record?.workflowInstances?.length ? 'Nghiệp vụ workflow' : 'Gắn workflow'}>
              <ApartmentOutlined
                style={{ color: record?.workflowInstances?.length ? '#52c41a' : '#1677ff', fontSize: 16, cursor: 'pointer' }}
                onClick={event => event.stopPropagation()}
              />
            </Tooltip>
          </Dropdown>
        </div>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (values) => {
    const enrichedValues = await enrichEntitiesWithWorkflowData(values, LEAD_WORKFLOW_ENTITY_TYPE);
    leadRowsRef.current = Array.isArray(enrichedValues?.embedded) ? enrichedValues.embedded : [];
    const leadId = getLeadIdFromHash();
    if (leadId) {
      const matchedLead = leadRowsRef.current.find(item => String(item?.id) === leadId);
      if (matchedLead) setDetailLead(matchedLead);
    }
    return enrichedValues;
  }, []);

  const onCreateLead = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/lead.edit',
    title: 'Tạo mới Lead',
    data: {
      record: {},
      listServices,
      listSale
    }
  });

  const onHandleSubmitSaleLead = async (value) => {
    const data = await RequestUtils.Post('/data/re-assign', {}, {
      dataId: detailRecord.id,
      saleId: value.saleId
    });
    if (data?.errorCode === 200) {
      f5List('data/lists');
      InAppEvent.normalSuccess("Lead đã được chuyển.");
      setDetailRecord({});
    } else {
      InAppEvent.normalError("Lỗi chuyển lead!");
    }
  }

  return (
    <div>
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
        filter={<LeadFilter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={LEAD_API_PATH}
        customClickCreate={onCreateLead}
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
        entityLabel="Lead"
      />

      <LeadDetailDrawer
        open={Boolean(detailLead?.id)}
        lead={detailLead}
        listSale={listSale}
        onClose={closeLeadDetail}
        onWorkflowAction={() => {
          const record = detailLead;
          closeLeadDetail();
          if (record?.workflowInstances?.length) {
            openWorkflowDrawer(record, record, {
              entityName: LEAD_WORKFLOW_ENTITY_TYPE,
              entityLabel: 'Lead',
            });
            return;
          }
          openWorkflowModal(record, LEAD_WORKFLOW_ENTITY_TYPE, { flowType: 'LEAD' });
        }}
      />

      <ModaleStyles
        title={
          <div style={{ color: '#fff' }}>
            Chọn sale chăm sóc lead
          </div>
        }
        open={(detailRecord?.id ?? 0) !== 0}
        footer={<NoFooter />}
        onCancel={() => setDetailRecord({})}
      >
        <div style={{ padding: 15 }}>
          <Form
            layout='vertical'
            form={form}
            onFinish={onHandleSubmitSaleLead}
          >
            <FormSelect
              required={true}
              label="Chọn sale"
              name="saleId"
              placeholder="Sale phụ trách"
              resourceData={listSale || []}
              valueProp="id"
              titleProp="name"
            />
            <Form.Item style={{ display: 'flex', justifyContent: 'end', marginTop: 10 }}>
              <Button type="primary" htmlType="submit"> Submit </Button>
            </Form.Item>
          </Form>
        </div>
      </ModaleStyles>
    </div>
  )
}

export default LeadPage
