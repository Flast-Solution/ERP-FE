/**************************************************************************/
/*  Cancel.js                                                             */
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

import React, { useState } from 'react';
import { Helmet } from "react-helmet";
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import ListOrder from 'containers/Order/List';
import { useEffectAsync } from 'hooks/MyHooks';
import RequestUtils from 'utils/RequestUtils';

const OrderCancel = () => {

  const [title] = useState("Danh sách đơn hủy");
  const [filter, setFilter] = useState({ type: "order", status: -1 });

  useEffectAsync(async () => {
    const listStatus = await RequestUtils.GetAsList("/order-status/fetch");
    const statusCancel = listStatus.find(i => i.name === "Hủy đơn")?.id ?? -1;
    setFilter(pre => ({ ...pre, status: statusCancel }))
  }, []);

  return <>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <CustomBreadcrumb
      data={[{ title: 'Trang chủ' }, { title: title }]}
    />
    <ListOrder filter={filter} />
  </>
};

export default OrderCancel;