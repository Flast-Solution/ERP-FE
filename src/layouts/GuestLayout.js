/**************************************************************************/
/*  GuestLayout.js                                                        */
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

import React, { Suspense } from 'react';
import { Layout } from 'antd';
import Loading from 'components/Loading';
import { useStore } from 'DataContext';
import { useRoutes } from "react-router-dom";

const GuestLayout = (props) => {
    const { routes } = useStore();
    return (
        <Layout>
            <Layout.Content>
                <Suspense fallback={<Loading />}>
                    {useRoutes(routes)}
                    {props.children}
                </Suspense>
            </Layout.Content>
        </Layout>
    );
};

export default GuestLayout;
