/**************************************************************************/
/*  InAppNotify.js                                                        */
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

import React, { useEffect } from 'react';
import { notification } from 'antd';
import { INAPP_NOTIFICATION_EMITTER } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';

const InAppNotify = () => {

  const showNotify = (data) => {
    const { type, content, title } = data;
    notification[type]({
      message: title || 'Thông báo',
      description: content,
      duration: 5
    });
  }

  useEffect(() => {
    InAppEvent.addEventListener(INAPP_NOTIFICATION_EMITTER, showNotify);
    return () => {
      InAppEvent.removeListener(INAPP_NOTIFICATION_EMITTER, showNotify);
    };
  }, []);

  return <div className="in-app-noti" style={{ display: 'none' }}></div>
}

export default InAppNotify;