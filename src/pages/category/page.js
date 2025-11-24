/**************************************************************************/
/*  page.js                                                               */
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
import { Button, message, Space } from 'antd';
import { cloneDeep } from 'lodash';
import RestList from "@/components/RestLayout/RestList";
import useGetList from "@/hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import Filter from '@/pages/category/Filter';
import { InAppEvent } from "@/utils/FuseUtils";
import { HASH_MODAL } from '@/configs';
import { dateFormatOnSubmit, formatTime } from '@/utils/dataUtils';
import RequestUtils from '@/utils/RequestUtils';

const CatePage = () => {

  const onEdit = (item) => {
    let title = 'Sửa danh mục tin tức # ' + item.id;
    let hash = '#draw/cate.page';
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onCreateCatePage = () => InAppEvent.emit(HASH_MODAL, {
    hash: '#draw/cate.page',
    title: 'Tạo mới danh mục tin tức',
    data: {}
  });

  const onDeleteCate = async ({ id }) => {
    const { message: MSG } = await RequestUtils.Post("/category/page/delete", {}, {id});
    message.info(MSG);
  }

  const [ title ] = useState("Danh mục tin tức");
  const CUSTOM_ACTION = [
    {
      title: "Tên",
      dataIndex: 'name',
      width: 150,
      ellipsis: true
    },
    {
      title: "Slug",
      dataIndex: 'slug',
      width: 120,
      ellipsis: true
    },
    {
      title: "Tiêu để",
      dataIndex: 'title',
      width: 150,
      ellipsis: true
    },
    {
      title: "Mô tả",
      dataIndex: 'desc',
      width: 250,
      ellipsis: true
    },
    {
      title: "Ngày",
      dataIndex: 'createdAt',
      width: 120,
      ellipsis: true,
      render: (createdAt) => formatTime(createdAt)
    },
    {
      title: "Trạng thái",
      dataIndex: 'status',
      ellipsis: true,
      width: 120,
      render: (status) => (status || 0) === 0 ? 'Ngưng' : 'Kích hoạt'
    },
    {
      title: "",
      width: 140,
      fixed: 'right',
      render: (record) => (
        <Space gap={8}>
          <Button color="danger" variant="dashed" onClick={() => onEdit(record)} size='small'>Detail</Button>
          <Button onClick={() => onDeleteCate(record)} size='small'>Xóa</Button>
        </Space>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: title }]}
      />
      <RestList
        xScroll={1200}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'category/page/fetch'}
        customClickCreate={onCreateCatePage}
        columns={CUSTOM_ACTION}
      />
    </>
  )
};

export default CatePage;