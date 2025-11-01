/**************************************************************************/
/*  MyHooks.js                                                            */
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

import React, { useEffect } from "react"

export const useMount = (callback) => {
  useEffect(() => {
    callback();
    /* eslint-disable-next-line */
  }, []);
}

/* useUnmount(() => console.log("useUnmount")) */
export const useUnmount = (callback) => {
  const callbackRef = React.useRef(callback)
  callbackRef.current = callback
  useEffect(() => {
    return () => {
      callbackRef.current()
    }
  }, []);
}

/* const [count, setCount] = useSetState(initState) 
*  setCount({ name: 'medium' })
*/
export const useSetState = (initState) => {
  const [state, setState] = React.useState(initState)
  const setMergeState = (value) => setState((prevValue) => {
    const newValue = typeof value === 'function' ? value(prevValue) : value
    return newValue ? { ...prevValue, ...newValue } : prevValue
  })
  return [state, setMergeState]
}

/*
const [ count, setCount ] = React.useState(0)
useUpdateEffect(() => {
  console.log('Count changed', count)
}, [ count ])
*/
export const useUpdateEffect = function (effectCallback, deps = []) {

  const isFirstMount = React.useRef(false)
  useEffect(() => {
    return () => {
      isFirstMount.current = false
    }
  }, []);

  useEffect(() => {
    /* Không thực thi code cho lần đầu tiên watch */
    if (!isFirstMount.current) {
      isFirstMount.current = true
    } else {
      return effectCallback()
    }
    /* eslint-disable-next-line */
  }, deps);
}

/*
useEffectAsync(async () => {
  const books = await fetchBooks();
  setBooks(books);
});
*/
export function useEffectAsync(effect, inputs = []) {
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      await effect(isMounted);
    };
    run();
    return () => { isMounted = false; };
    /* eslint-disable-next-line */
  }, inputs);
}
