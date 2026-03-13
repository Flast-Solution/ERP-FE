/**************************************************************************/
/*  useGetMe.js                                                 		  */
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

import { useContext } from 'react';
import MyContext from '@/DataContext';
import authRoles from '@/auth/authRoles';

function useGetMe() {
    const { user, setMyData } = useContext(MyContext);

    const hasRole = (roles) => {
        if (!user || !user.roles) return false;
        return roles.some(role => user.roles.includes(role));
    };

    const isLeader = () => hasRole([...authRoles.admin, ...authRoles.partner]);
    const isManager = () => hasRole([...authRoles.admin, ...authRoles.partner, ...authRoles.provider]);
    const isUser = () => !isLeader() && !isManager();

    return {
        user,
        setMe: (me) => setMyData(pre => ({ ...pre, user: me })),
        isLeader,
        isManager,
        isUser,
        hasRole
    };
}

export default useGetMe;
