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


import React, { useState } from 'react';
import { message } from 'antd';
import RestList from "@/components/RestLayout/RestList";
import useGetList from "@/hooks/useGetList";
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import Filter from '@/pages/tag/Filter';
import { GATEWAY } from '@/configs';
import RequestUtils from '@/utils/RequestUtils';
import { useNavigateSearch } from '@/hooks/useNavigateSearch';

const Tag = () => {

    const navigate = useNavigateSearch();
    const onEdit = (item) => {
        navigate("/tag/edit", { id: item.id });
    }

    const onDeleteCate = async ({ id }) => {
        const { message: MSG } = await RequestUtils.Post("/tag/delete", {}, { id });
        message.info(MSG);
    }

    const [title] = useState("Trang quản lý Tag");
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
            title: "Mô tả",
            dataIndex: 'description',
            width: 200,
            ellipsis: true
        }
    ]

    return <>
        <Helmet>
            <title>{title}</title>
        </Helmet>
        <CustomBreadcrumb
            data={[{ title: 'Trang chủ' }, { title: title }]}
        />
        <RestList
            apiPath={GATEWAY + "/tag/get-list"}
            useGetAllQuery={useGetList}
            columns={CUSTOM_ACTION}
            filter={<Filter />}
            onEdit={onEdit}
            onDelete={onDeleteCate}
            customClickCreate={() => navigate("/tag/edit")}
            initialFilter={{ page: 1, limit: 10 }}
        />
    </>
}

export default Tag;