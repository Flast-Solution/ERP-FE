import BannerImage from './BannerImage';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input, message, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { Helmet } from 'react-helmet';
import { BreadcrumbCustom } from '@flast-erp/core/components';
import { useNavigateSearch } from '@flast-erp/core/hooks';
import useGetMe from '@/hooks/useGetMe';
import { deleteBanner, listBanners } from './service';
import { BANNER_POSITIONS, bannerImages } from './config';
export default function BannerPage() {
  const { hasPermission } = useGetMe();
  const navigate = useNavigateSearch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState();
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listBanners()); } catch (error) { message.error(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async id => {
    try { await deleteBanner(id); message.success('Đã xóa banner'); await load(); }
    catch (error) { message.error(error.message); }
  };
  const columns = [
    { title: 'Ảnh', dataIndex: 'imageUrls', width: 140, render: urls => {
      const firstImage = bannerImages(urls)[0];
      return firstImage ? <BannerImage value={firstImage} width={100} height={60} style={{ objectFit: 'contain' }} /> : '—';
    } },
    { title: 'Số lượng ảnh', key: 'imageCount', width: 130, align: 'center', render: (_, row) => bannerImages(row.imageUrls).length },
    { title: 'Tên banner', dataIndex: 'name' },
    { title: 'Liên kết', dataIndex: 'targetUrl', ellipsis: true },
    { title: 'Vị trí', dataIndex: 'position', render: value => BANNER_POSITIONS.find(item => item.value === value)?.label || value },
    { title: 'Thứ tự', dataIndex: 'sortOrder', sorter: (a, b) => a.sortOrder - b.sortOrder },
    { title: 'Trạng thái', dataIndex: 'active', render: active => <Tag color={active ? 'green' : 'default'}>{active ? 'Đang hiển thị' : 'Đã ẩn'}</Tag> },
    { title: 'Thao tác', key: 'actions', render: (_, row) => <Space>
      {hasPermission('web.banner.update') && <Button onClick={() => navigate('/banner/edit', { id: row.id })}>Sửa</Button>}
      {hasPermission('web.banner.delete') && <Popconfirm title="Xóa banner này?" onConfirm={() => remove(row.id)} okText="Xóa" cancelText="Hủy"><Button danger>Xóa</Button></Popconfirm>}
    </Space> },
  ];
  return <>
    <Helmet><title>Quản lý banner</title></Helmet>
    <BreadcrumbCustom data={[{ title: 'Trang chủ' }, { title: 'Quản lý banner' }]} />
    <Space wrap style={{ marginBottom: 16 }}>
      <Input placeholder="Tìm tên banner" aria-label="Tìm tên banner" allowClear value={query} onChange={event => setQuery(event.target.value)} />
      <Select placeholder="Tất cả vị trí" aria-label="Lọc vị trí" allowClear options={BANNER_POSITIONS} value={position} onChange={setPosition} style={{ width: 210 }} />
      <Button onClick={load}>Làm mới</Button>
      {hasPermission('web.banner.create') && <Button type="primary" onClick={() => navigate('/banner/edit')}>Thêm banner</Button>}
    </Space>
    <Table rowKey="id" columns={columns} loading={loading} dataSource={rows.filter(row => (!position || row.position === position) && (row.name || '').toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0))} scroll={{ x: 1000 }} pagination={{ defaultPageSize: 10, showSizeChanger: true }} />
  </>;
}
