/**************************************************************************/
/*  useLogin.js                                                           */
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

import { useState } from 'react';
import RequestUtils from 'utils/RequestUtils';
import jwtService from 'utils/jwtService';

/* const log = (key, val) => console.log('[hooks.useLogin] ' + key, val); */
function useLogin() {

  const [loading, setLoading] = useState(false);
  const login = (payload) => {
    setLoading(true);
    RequestUtils.Post('/auth/sign-in', payload).then(({ data, success }) => {
      if (success) {
        jwtService.setSession(data);
      }
      setLoading(false);
    }).catch(e => {
      setLoading(false);
    })
  };

  return { login, loading };
}

export default useLogin;
