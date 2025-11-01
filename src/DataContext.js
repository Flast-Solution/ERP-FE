/**************************************************************************/
/*  DataContext.js                                                        */
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

import React, { useReducer, useCallback, useEffect } from 'react'
import { ACTIONS, CHANGE_STORE } from 'configs';
import { InAppEvent } from 'utils/FuseUtils';
import routes from 'routes/PrivateRoutes';

const DataContext = React.createContext();

const actions = {
  [ACTIONS.ADD_USER]: 'user',
  [ACTIONS.REMOVE_USER]: 'user',
  [ACTIONS.TOOGLE_COLLAPSE]: 'isCollapse',
  [ACTIONS.F5_LIST]: 'f5List'
};

function storeReducer(state, action) {
  const { data, type } = action;
  const varible = actions[type];
  return !varible ? state : {
    ...state,
    [varible]: data
  }
}

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, {
    routes: routes, isCollapse: false
  })
  const value = { ...state, dispatch };
  const handleEventChange = useCallback(({ type, data }) => {
    dispatch({ type, data });
  }, [dispatch]);

  useEffect(() => {
    /* InAppEvent.emit(CHANGE_STORE, { type: 'user', data: data }); */
    InAppEvent.addEventListener(CHANGE_STORE, handleEventChange);
    return () => {
      InAppEvent.removeListener(CHANGE_STORE, handleEventChange);
    };
  }, [handleEventChange]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useStore() {
  const context = React.useContext(DataContext)
  if (context === undefined) {
    throw new Error('useCount must be used within a StoreProvider')
  }
  return context
}

export default DataContext;