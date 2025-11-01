/**************************************************************************/
/*  useGetRestApi.js                                                      */
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

import { useCallback, useContext, useEffect, useState } from "react";
import RequestUtils from "utils/RequestUtils";
import MyContext from 'DataContext';
import { useUpdateEffect } from "hooks/MyHooks";

function useGetRestApi({
    queryParams: filter,
    onData = (values) => values
}) {

    const { f5List } = useContext(MyContext)
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({});
    const fetchResource = useCallback(async (values) => {
        if (loading) {
            return Promise.reject("===== fetch api on loading .!");
        }
        const { resource, ...params } = values;
        if (!resource) {
            return Promise.reject("Call api without apiPath .!");
        }
        setLoading(true);
        RequestUtils.Get(`/${resource}`, params).then(async ({ data, success }) => {
            if (success) {
                Promise.resolve(onData(data)).then(setData);
            }
            setLoading(false);
        }).catch(e => {
            console.log('[hooks.useGetApi] ', e);
            setLoading(false);
        });
    }, [onData, loading]);

    useEffect(() => {
        fetchResource(filter);
        /* eslint-disable-next-line */
    }, []);

    useUpdateEffect(() => {
        fetchResource(filter);
    }, [f5List, filter]);

    return {
        data,
        loading
    };
}

export default useGetRestApi;
