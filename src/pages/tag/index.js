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
import { fetchTags, deleteTag, saveTagProducts } from './service';
import ProductAssignmentModal from '@/components/ProductAssignmentModal';
import ContentAssignmentModal from '@/components/ContentAssignmentModal';
import { saveTagContents } from '@/pages/category/contentAssignmentService';
import { fetchCategoryProductOptions } from '@/pages/category/productAssignmentService';

export default function Tag() {
  const { hasPermission } = useGetMe();
  const navigate = useNavigateSearch();
  const [tags, setTags] = useState([]);
  const [productTag, setProductTag] = useState(null);
  const [contentTag, setContentTag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({ name: '', type: 'product', page: 1, limit: 20 });
  const [total, setTotal] = useState(0);
  const { type } = filter;
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setTags([]);
    try {
      const result = await fetchTags(filter);
      if (current === requestId.current) {
        setTags(result.items);
        setTotal(
          result.total ??
            (filter.page - 1) * filter.limit +
              result.items.length +
              (result.items.length === filter.limit ? 1 : 0),
        );
      }
    } catch (error) {
      if (current === requestId.current) message.error(error.message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [filter]);
  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);
  const remove = async (id) => {
    try {
      await deleteTag(id);
      message.success('Đã xóa tag');
      await load();
    } catch (error) {
      message.error(error.message);
    }
  };
  const columns = [
    { title: 'Tên', dataIndex: 'name' },
    {
      title: 'Loại tag',
      dataIndex: 'type',
      render: (type) => ({ product: 'Sản phẩm', pages: 'Trang' })[type] || type || '—',
    },
    { title: 'Mô tả', dataIndex: 'description' },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, tag) => (
        <Space wrap>
          {hasPermission('web.tag.update') && (tag.type || type) === 'pages' && (
            <Button onClick={() => setContentTag(tag)}>Gắn trang tin tức</Button>
          )}
          {hasPermission('web.tag.update') && (tag.type || type) === 'product' && (
            <Button onClick={() => setProductTag(tag)}>Gắn sản phẩm</Button>
          )}
          {hasPermission('web.tag.update') && (
            <Button onClick={() => navigate('/tag/edit', { id: tag.id, type })}>Sửa</Button>
          )}
          {hasPermission('web.tag.delete') && (
            <Popconfirm
              title="Xóa tag này?"
              onConfirm={() => remove(tag.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger>Xóa</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  return (
    <>
      {contentTag ? (
        <ContentAssignmentModal
          title="Gắn tag cho trang tin tức"
          subjectLabel="Tag"
          subjectName={contentTag.name}
          initialSelectedIds={contentTag.contentIds}
          onSave={(contentIds) => saveTagContents(contentTag.id, contentIds)}
          onSaved={load}
          onClose={() => setContentTag(null)}
        />
      ) : null}
      {productTag ? (
        <ProductAssignmentModal
          title="Gắn tag cho sản phẩm"
          subjectLabel="Tag"
          subjectName={productTag.name}
          initialSelectedIds={productTag.productIds}
          fetchProducts={fetchCategoryProductOptions}
          onSave={(productIds) => saveTagProducts(productTag.id, productIds)}
          onSaved={load}
          onClose={() => setProductTag(null)}
          successMessage="Đã gắn tag cho sản phẩm."
        />
      ) : null}
      <Helmet>
        <title>Trang quản lý Tag</title>
      </Helmet>
      <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Trang quản lý Tag' }]} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          aria-label="Loại tag"
          value={type}
          onChange={(type) => setFilter((current) => ({ ...current, type, page: 1 }))}
          style={{ minWidth: 180 }}
          options={[
            { value: 'product', label: 'Sản phẩm (product)' },
            { value: 'pages', label: 'Trang (pages)' },
          ]}
        />
        <Input.Search
          placeholder="Tìm tên tag"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          allowClear
          enterButton="Tìm kiếm"
          onSearch={(name) => setFilter((current) => ({ ...current, name: name.trim(), page: 1 }))}
        />
        <Button onClick={load}>Làm mới</Button>
        {hasPermission('web.tag.create') && (
          <Button type="primary" onClick={() => navigate('/tag/edit', { type })}>
            Thêm tag
          </Button>
        )}
      </Space>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={tags}
        pagination={{
          current: filter.page,
          pageSize: filter.limit,
          total,
          showSizeChanger: true,
          onChange: (page, limit) => setFilter((current) => ({ ...current, page, limit })),
        }}
      />
    </>
  );
}
