
/**************************************************************************/
/*  Auth.js                                                               */
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

import React, { useCallback, useEffect, useState } from 'react';
import jwtService from 'utils/jwtService';
import { useStore } from "DataContext";
import { ACTIONS } from 'configs';

const log = (value) => console.log('[auth.Auth] ', value);
const Auth = (props) => {

	const [state, setState] = useState({ waitAuthCheck: true })
	const { dispatch } = useStore();

	const logout = useCallback(() => {
		log('====== Logout ACTIONS.REMOVE_USER =====')
		dispatch({ type: ACTIONS.REMOVE_USER });
	}, [dispatch]);

	useEffect(() => {
		const jwtCheck = () => new Promise(resolve => {
			jwtService.on('onAutoLogin', async () => {
				resolve(jwtService.signInWithToken())
			});

			jwtService.on('onAutoLogout', (message) => {
				logout();
				resolve();
			});

			jwtService.on('onNoAccessToken', () => {
				resolve();
			});

			jwtService.init();
			return Promise.resolve();
		});
		jwtCheck().then(() => setState({ waitAuthCheck: false }));
	}, [logout]);

	return state.waitAuthCheck ? null : <React.Fragment children={props.children} />;
}

export default Auth;
