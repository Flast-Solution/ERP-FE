/**************************************************************************/
/*  post.js                                                               */
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
import { GATEWAY, HASH_MODAL } from '@/configs';
import { dateFormatOnSubmit, formatTime } from '@/utils/dataUtils';
import CustomImage from '@/components/common/CustomImage';
import RequestUtils from '@/utils/RequestUtils';
import { useNavigateSearch } from '@/hooks/useNavigateSearch';

const Post = () => {

  const navigate = useNavigateSearch();
  const onEdit = (item) => {
    let title = 'Sửa tin tức # ' + item.id;
    let hash = '#draw/post.edit';
    let data = cloneDeep(item);
    InAppEvent.emit(HASH_MODAL, { hash, title, data });
  }

  const onDeleteCate = async ({ id }) => {
    const { message: MSG } = await RequestUtils.Post("/page-content/delete", {}, {id});
    message.info(MSG);
  }

  const [ title ] = useState("Trang bài viết tin tức");
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
      title: "Hình ảnh",
      dataIndex: 'image',
      width: 150,
      ellipsis: true,
      render: (image) => (
        <CustomImage
          preview={false}
          width={50}
          src={String(GATEWAY).concat(image)}
          alt='image'
        />
      )
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
        apiPath={'page-content/fetch'}
        customClickCreate={() => navigate("post/edit")}
        columns={CUSTOM_ACTION}
      />
    </>
  )
};

export default Post;