import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet";
import { cloneDeep } from 'lodash';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Form } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import styled from "styled-components";
import Filter from './Filter';

import { InAppEvent } from "@flast-erp/core/utils/FuseUtils";
import { HASH_MODAL } from 'configs';
import RequestUtils, { SUCCESS_CODE } from '@flast-erp/core/utils/RequestUtils';
import { formatTime } from '@flast-erp/core/utils/dataUtils';

const StyledTable = styled(Table)`
  /* pagination container */
  .ant-pagination {
    margin-top: 16px;
  }

  .ant-pagination-item {
    border-radius: 4px;
    transition: all 0.2s;
  }

  .ant-pagination-item:hover {
    border-color: #1677ff;
  }

  .ant-pagination-item:hover a {
    color: #fff;
  }

  .ant-pagination-item-active {
    background-color: #1677ff;
    border-color: #1677ff;
  }

  .ant-pagination-item-active a {
    color: #fff;
  }

  .ant-pagination-prev,
  .ant-pagination-next {
    border-radius: 4px;
  }
`;

  const statusTag = (status) => {
    switch (status) {
      case 1:
        return <Tag color="green" style={{borderRadius: 50, fontSize: 12}}>Đang hoạt động</Tag>;
      case 2:
        return <Tag color="gold" style={{borderRadius: 50, fontSize: 12}}>Ngừng</Tag>;
      default:
        return <Tag style={{borderRadius: 50, fontSize: 12}}>Bản nháp</Tag>;
    }
  };

  const cleanFilters = (filters) => {
    return Object.fromEntries(
      Object.entries(filters).filter(([_, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ''
      )
    );
  };

  const onEdit = (item) => {

    let data = cloneDeep(item);
    // Map criteria list object to array of IDs if needed for the form select
    if (Array.isArray(item.qcCriteriaList)) {
      data.idCriteriaList = item.qcCriteriaList.map(c => c.idQcCriteria);
    }
    
    InAppEvent.emit(HASH_MODAL, {
      hash: '#draw/qc.checklist.edit',
      title: 'Sửa Bộ quy trình QC # ' + item.idQcCheckList,
      data
    });
  }

  const columns = [
    {
      title: "Tên Quy trình",
      dataIndex: 'qcCheckListName',
      width: 200,
      ellipsis: true,
      render: (text, record) => {
        return (
          <a href='/#' onClick={() => onEdit(record)} style={{ cursor: 'pointer' }}>{text}</a>
        )
      }
    },
    // {
    //   title: "Sản phẩm",
    //   dataIndex: "product",
    //   render: (text) => <Tag color="blue">{text}</Tag>,
    // },
    {
        title: "Mã",
        dataIndex: 'qcCheckListCode',
        width: 120,
        ellipsis: true
    },
    {
      title: "Số bước",
      dataIndex: 'qcCriteriaList',
      render: (list) => list ? (Array.isArray(list) ? list.length : 0) : 0,
      width: 100
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      render: statusTag,
    },
    // {
    //   title: "Người tạo",
    //   dataIndex: "creator",
    // },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      render: (time) => formatTime(time)
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
        </Space>
      ),
    },
];


const ChecklistIndex = () => {
  const [ title ] = useState("Quản lý quy trình QC");
  const [ pagination, setPagination ] = useState({ page: 1, limit: 10, total: 0});
  const [ filters, setFilters ] = useState({ qcCheckListName: '', qcCheckListCode: '', isActive: undefined});
  const [ listDataQc, setListDataQc ] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const listQc = async () => {
      const cleanedFilters = cleanFilters(filters);
      const query = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...cleanedFilters,
      }).toString();
      const res = await RequestUtils.Get(`/qms/qc-check-list/fetch?${query}`);
      if (res?.errorCode === SUCCESS_CODE) {
        const data = res?.data;
        setListDataQc(data?.embedded ?? []);
        setPagination(prev => ({
          ...prev,
          total: data?.page?.totalElements ?? 0,
        }));
      }
    }
    listQc();
  },[pagination.page, pagination.limit, filters])

  const handleFilter = (values) => {
    setFilters(values);
  };

  const onCreate = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/qc.checklist.edit',
    title: 'Tạo mới Bộ quy trình QC',
    data: {}
  });

  return (
      <>
          <Helmet>
            <title>{title}</title>
          </Helmet>
          <CustomBreadcrumb
            data={[{ title: 'Trang chủ' }, { title: title }]}
          />
          <div style={{ padding: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <h2 style={{fontWeight: 700}}>Quản lý Quy trình Kiểm định QC</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              Tạo Quy trình
            </Button>
          </Row>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
            <Card>
              <Statistic
                title="Tổng quy trình"
                value={12}
                formatter={(value) => (
                  <>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                    <span style={{ color: "#52c41a", marginLeft: 8, fontWeight: 600, fontSize: 14 }}>
                      +2 tháng này
                    </span>
                  </>
                )}
              />
            </Card>
            </Col>
            <Col span={6}>
            <Card>
              <Statistic
                title="Đang áp dụng"
                value={8}
                formatter={(value) => (
                  <>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                    <span style={{ color: "#1677ff", marginLeft: 8, fontWeight: 600, fontSize: 14 }}>
                      Active
                    </span>
                  </>
                )}
              />
            </Card>
            </Col>
            <Col span={6}>
            <Card>
              <Statistic
                title="Tỉ lệ đạt (QA)"
                value={98.4}
                formatter={(value) => (
                  <>
                    <span style={{ fontWeight: 700 }}>{value}%</span>
                    <span style={{ marginLeft: 8, color: "#8c8c8c",fontWeight: 600, fontSize: 12 }}>
                      Tiêu chuẩn ISO
                    </span>
                  </>
                )}
              />
            </Card>
            </Col>
            <Col span={6}>
            <Card>
              <Statistic
                title="Cảnh báo lỗi"
                value={3}
                formatter={(value) => (
                  <>
                    <span style={{ fontWeight: 700, color: "red" }}>{value}</span>
                    <span
                      style={{
                        marginLeft: 8,
                        background: "#fff1f0",
                        color: "#cf1322",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Cần kiểm tra
                    </span>
                  </>
                )}
              />
            </Card>
            </Col>
          </Row>

          <Card title={<span style={{ fontWeight: 700, fontSize: 20 }}>Danh sách quy trình</span>}>
            <Form form={form}>
              <Filter form={form} onFilter={handleFilter} />
            </Form>
            <StyledTable
              dataSource={listDataQc}
              rowKey="idQcCheckList"
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                onChange: (page, pageSize) => {
                  setPagination(prev => ({
                    ...prev,
                    page,
                    limit: pageSize,
                  }));
                },
              }}
              columns={columns}
            />
          </Card>
          </div>
      </>
  );
}

export default ChecklistIndex;


