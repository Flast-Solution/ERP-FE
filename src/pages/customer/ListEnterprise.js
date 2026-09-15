/**************************************************************************/
/*  ListEnterprise.js                                                     */
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
import { Helmet } from 'react-helmet';
import { RestList, BreadcrumbCustom, DrawerCustom } from '@flast-erp/core/components';
import CustomerFilter from './Filter';
import { useGetList } from '@flast-erp/core/hooks';
import { Button, Space, Tag, Tooltip } from 'antd';
import { InAppEvent, RequestUtils, dateFormatOnSubmit, f5List, formatTime } from '@flast-erp/core/utils';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import EnterpriseForm from '@/containers/Order/EnterpriseForm';
import { SUCCESS_CODE } from '@/configs';

const StyledTag = styled(Tag)`
  cursor: pointer;
`;

const ListEnterprise = () => {

  let navigate = useNavigate();
  const [ title ] = useState("Khách doanh nghiệp");
  const [formDrawer, setFormDrawer] = useState({ open: false, enterprise: null });
  const [editingId, setEditingId] = useState(null);
  const CUSTOM_ACTION = [
    {
      title: "Khách hàng",
      dataIndex: 'companyName',
      width: 150,
      ellipsis: true
    },
    {
      title: "G.Đốc",
      dataIndex: 'director',
      width: 150,
      ellipsis: true
    },
    {
      title: "Số điện thoại",
      dataIndex: 'mobilePhone',
      width: 150,
      ellipsis: true
    },
    {
      title: "Mã S.Thuế",
      dataIndex: 'taxCode',
      width: 150,
      ellipsis: true
    },
    {
      title: "Email",
      dataIndex: 'email',
      width: 150,
      ellipsis: true,
      render: (email) => email || '(Chưa có)'
    },
    {
      title: "Địa chỉ",
      dataIndex: 'address',
      width: 170,
      ellipsis: true
    },
    {
      title: "Đ.Hàng",
      dataIndex: 'numOfOrder',
      width: 90,
      render: (value, record) => (Number.isInteger(value) && value > 0) ? (
        <StyledTag color="blue" icon={<ShoppingCartOutlined />} onClick={() => onHandleOrders(record)}>{value} Đơn</StyledTag>
      ) : '(Chưa có)'
    },
    {
      title: "Ngày tạo",
      dataIndex: 'inTime',
      width: 200,
      ellipsis: true,
      render: (inTime) => formatTime(inTime)
    },
    {
      title: "Thao tác",
      width: 120,
      fixed: 'right',
      ellipsis: true,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết doanh nghiệp">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onHandleDetail(record)} aria-label="Xem chi tiết doanh nghiệp" />
          </Tooltip>
          <Tooltip title="Chỉnh sửa doanh nghiệp">
            <Button
              type="text"
              icon={<EditOutlined />}
              loading={editingId === record.id}
              onClick={() => onHandleEdit(record)}
              aria-label="Chỉnh sửa doanh nghiệp"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onHandleOrders = (record) => {
    let uri = RequestUtils.generateUrlGetParams("/sale/order", {enterpriseId: record.id});
    navigate(uri);
  };

  const onHandleDetail = (record) => {
    navigate(`/customer/enterprise/${record.id}`, { state: { enterprise: record } });
  };

  const onHandleEdit = async (record) => {
    setEditingId(record.id);
    try {
      const response = await RequestUtils.Get('/erp/customer/info-enterprise', { id: record.id });
      const enterprise = response?.data?.enterprise;
      if (Number(response?.errorCode) !== SUCCESS_CODE || !enterprise) {
        InAppEvent.normalError(response?.message || 'Không tải được thông tin doanh nghiệp');
        return;
      }
      setFormDrawer({ open: true, enterprise });
    } catch (error) {
      InAppEvent.normalError(error?.message || 'Không tải được thông tin doanh nghiệp');
    } finally {
      setEditingId(null);
    }
  };

  const closeFormDrawer = () => setFormDrawer({ open: false, enterprise: null });

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
        initialFilter={{ limit: 10, page: 1 }}
        filter={<CustomerFilter taxCode={true} />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        hasCreate
        customClickCreate={() => setFormDrawer({ open: true, enterprise: null })}
        apiPath={'customer/fetch-customer-enterprise'}
        columns={CUSTOM_ACTION}
      />
      <DrawerCustom
        width={850}
        open={formDrawer.open}
        onClose={closeFormDrawer}
        title={formDrawer.enterprise ? `Cập nhật doanh nghiệp #${formDrawer.enterprise.id}` : 'Thêm mới doanh nghiệp'}
      >
        <EnterpriseForm
          key={formDrawer.enterprise?.id ?? 'create-enterprise'}
          initialValues={formDrawer.enterprise ?? undefined}
          onCancel={closeFormDrawer}
          onSuccess={() => {
            closeFormDrawer();
            f5List('customer/fetch-customer-enterprise');
          }}
        />
      </DrawerCustom>
    </div>
  )
}

export default ListEnterprise
