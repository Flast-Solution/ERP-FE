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

import { useCallback, useContext, useMemo } from 'react';
import { DataContext } from '@flast-erp/core/components';
import authRoles from '@/auth/authRoles';

function useGetMe() {
    const { user, setMyData } = useContext(DataContext)

    const userRoles = useMemo(() => {
        if (Array.isArray(user?.roles) && user.roles.length) {
            return user.roles;
        }
        return Array.isArray(user?.userProfiles)
            ? user.userProfiles.map(profile => profile?.type).filter(Boolean)
            : [];
    }, [user]);

    const hasRole = useCallback(
        roles => roles.some(role => userRoles.includes(role)),
        [userRoles],
    );

    const isLeader = useCallback(
        () => hasRole([...authRoles.admin, ...authRoles.partner, ...authRoles.leader]),
        [hasRole],
    );

    const isManager = useCallback(
        () => hasRole([
            ...authRoles.admin,
            ...authRoles.partner,
            ...authRoles.provider,
            ...authRoles.leader,
        ]),
        [hasRole],
    );

    const isUser = useCallback(() => !isLeader() && !isManager(), [isLeader, isManager]);

    return {
        user,
        setMe: (me) => setMyData(pre => ({ ...pre, user: me })),
        isLeader,
        isManager,
        isUser,
        hasRole,
    };
}

export default useGetMe;
