import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RestList, FormSelect, NoFooter } from '@flast-erp/core/components';
import { EyeOutlined, InfoCircleOutlined, UserAddOutlined } from '@ant-design/icons';
import LeadFilter from './LeadFilter';
import { useGetList } from "@flast-erp/core/hooks";
import { Button, Form, Tag, Tooltip } from 'antd';
import { RequestUtils, dateFormatOnSubmit, f5List } from '@flast-erp/core/utils';
import { HASH_MODAL } from '@/configs';
import { InAppEvent } from '@flast-erp/core/utils';
import { cloneDeep } from 'lodash';
import ModaleStyles from './style';
import { useNavigate } from "react-router-dom";
import { CHANNEL_SOURCE_MAP_KEYS } from '@/configs/localData';
import { LEAD_WORKFLOW_ENTITY_TYPE } from '@/containers/Order/List/constants';
import { enrichEntitiesWithWorkflowData } from '@/containers/Order/List/services/workflowApi';
import { useWorkflowDrawer } from '@/contexts/WorkflowDrawerContext';
import { getLeadStatusOption, mergeLeadStatusOptions } from './leadStatusOptions';

const LEAD_API_PATH = 'data/lists';

const hasLeadWorkflow = record => (
  (Array.isArray(record?.workflowInstances) && record.workflowInstances.length > 0)
  || Boolean(record?.workflowProcessId)
);

const LeadList = () => {
  const { openWorkflowDrawer } = useWorkflowDrawer();

  const [form] = Form.useForm();
  const [listSale, setListSale] = useState([]);
  const [detailRecord, setDetailRecord] = useState({});
  const [listServices, setlistServices] = useState([]);
  const [listStatus, setListStatus] = useState([]);

  useEffect(() => {
    RequestUtils.GetAsList('/service/list').then(setlistServices);
    RequestUtils.GetAsList('/user/list-name-id').then(setListSale);
    RequestUtils.GetAsList('/entity-status/list-by-type', { type: 'LEAD' }).then(setListStatus);
  }, [])

  const statusOptions = useMemo(
    () => mergeLeadStatusOptions(listStatus),
    [listStatus],
  );

  useEffect(() => {
    form.setFieldsValue({ saleId: detailRecord?.saleId })
  }, [form, detailRecord])

  const onEdit = (item) => {
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, {
      hash: '#draw/lead.edit',
      title: 'Chi tiết Lead #' + item.id,
      data: {
        record: data,
        listServices,
        listSale
      }
    });
  }

  const openLeadProgress = useCallback((record) => {
    const workflowInstances = Array.isArray(record?.workflowInstances)
      ? record.workflowInstances
      : [];
    if (!hasLeadWorkflow(record)) {
      InAppEvent.normalError('Lead chưa được cấu hình workflow.');
      return;
    }
    openWorkflowDrawer(record, record, {
      entityName: LEAD_WORKFLOW_ENTITY_TYPE,
      entityLabel: 'Lead',
      entityType: LEAD_WORKFLOW_ENTITY_TYPE,
      workflowInstances,
      includeAllInstances: true,
      leadMode: true,
    });
  }, [openWorkflowDrawer]);

  let navigate = useNavigate();
  const onCreateOpportunity = useCallback(({ id }) => {
    navigate(RequestUtils.generateUrlGetParams("/sale/ban-hang", { dataId: id }));
  }, [navigate]);

  const CUSTOM_ACTION = [
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
      dataIndex: 'productNames',
      width: 200,
      ellipsis: true,
      render: (productNames) => (
        Array.isArray(productNames) && productNames.length > 0
          ? productNames.join(', ')
          : '-'
      )
    },
    {
      title: "Trạng thái",
      dataIndex: 'status',
      width: 140,
      render: (status) => {
        const statusItem = getLeadStatusOption(status, listStatus);
        return statusItem
          ? <Tag color={statusItem.color || undefined}>{statusItem.name}</Tag>
          : '-';
      }
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
      render: (record) => {
        const hasWorkflow = hasLeadWorkflow(record);
        return (
          <div style={{ display: 'flex', gap: 20 }}>
            <Tooltip style={{ cursor: 'pointer' }} title="Chuyển sale">
              <UserAddOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => {
                setDetailRecord(record)
              }} />
            </Tooltip>
            <Tooltip style={{ cursor: 'pointer' }} title="Xem chi tiết Lead">
              <EyeOutlined style={{ color: '#1677ff', fontSize: 16 }} onClick={() => onEdit(record)} />
            </Tooltip>
            <Tooltip style={{ cursor: 'pointer' }} title="Xem tiến trình Lead">
              <InfoCircleOutlined
                style={{
                  color: hasWorkflow ? '#52c41a' : '#bfbfbf',
                  fontSize: 16,
                  cursor: hasWorkflow ? 'pointer' : 'not-allowed',
                }}
                onClick={hasWorkflow ? () => openLeadProgress(record) : undefined}
              />
            </Tooltip>
          </div>
        );
      }
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (values) => {
    return enrichEntitiesWithWorkflowData(values, LEAD_WORKFLOW_ENTITY_TYPE);
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
    <>
      <RestList
        xScroll={1200}
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<LeadFilter statusOptions={statusOptions} />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={LEAD_API_PATH}
        customClickCreate={onCreateLead}
        columns={CUSTOM_ACTION}
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
    </>
  )
}

export default LeadList
