/**************************************************************************/
/*  post.js                                                               */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui, DuongTM         */
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
import { Button, Input, message, Popconfirm, Select, Space, Table } from 'antd';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useNavigateSearch } from '@flast-erp/core/hooks';
import useGetMe from '@/hooks/useGetMe';
import { listTags, deleteTag } from './service';

export default function Tag() {
  const { hasPermission } = useGetMe();
  const navigate = useNavigateSearch();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('product');
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setTags([]);
    try { const rows = await listTags(type); if (current === requestId.current) setTags(rows); }
    catch (error) { if (current === requestId.current) message.error(error.message); }
    finally { if (current === requestId.current) setLoading(false); }
  }, [type]);
  useEffect(() => { load(); }, [load]);
  const remove = async id => {
    try { await deleteTag(id); message.success('Đã xóa tag'); await load(); }
    catch (error) { message.error(error.message); }
  };
  const columns = [
    { title: 'Tên', dataIndex: 'name' },
    { title: 'Loại tag', dataIndex: 'type', render: type => ({ product: 'Sản phẩm', pages: 'Trang' }[type] || type || '—') },
    { title: 'Mô tả', dataIndex: 'description' },
    { title: 'Thao tác', key: 'actions', render: (_, tag) => <Space>
      {hasPermission('web.tag.update') && <Button onClick={() => navigate('/tag/edit', { id: tag.id, type })}>Sửa</Button>}
      {hasPermission('web.tag.delete') && <Popconfirm title="Xóa tag này?" onConfirm={() => remove(tag.id)} okText="Xóa" cancelText="Hủy"><Button danger>Xóa</Button></Popconfirm>}
    </Space> },
  ];
  return <>
    <Helmet><title>Trang quản lý Tag</title></Helmet>
    <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Trang quản lý Tag' }]} />
    <Space style={{ marginBottom: 16 }} wrap>
      <Select aria-label="Loại tag" value={type} onChange={setType} style={{ minWidth: 180 }} options={[{ value: 'product', label: 'Sản phẩm (product)' }, { value: 'pages', label: 'Trang (pages)' }]} />
      <Input placeholder="Tìm tên tag" value={query} onChange={event => setQuery(event.target.value)} allowClear />
      <Button onClick={load}>Làm mới</Button>
      {hasPermission('web.tag.create') && <Button type="primary" onClick={() => navigate('/tag/edit', { type })}>Thêm tag</Button>}
    </Space>
    <Table rowKey="id" loading={loading} columns={columns} dataSource={tags.filter(tag => (tag.name || '').toLocaleLowerCase().includes(query.toLocaleLowerCase()))} pagination={{ pageSize: 10, showSizeChanger: true }} />
  </>;
}
