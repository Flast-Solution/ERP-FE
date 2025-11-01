/**************************************************************************/
/*  useGetOneQuery.js                                                 	  */
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

import { useCallback, useEffect, useState } from "react";
import RequestUtils from "utils/RequestUtils";

function useGetOneQuery({ filter, uri, onBeforeProcessData }) {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({});

    const fetchResource = useCallback(() => {
        if (loading) {
            return Promise.reject("===== fetch api on loading .!");
        }
        setLoading(true);
        if (uri) {
            RequestUtils.Get('/'.concat(uri), filter).then(({ data, success }) => success && setData(data));
        }
        setLoading(false);
    }, [filter, uri, loading]);

    useEffect(() => {
        fetchResource();
        /* eslint-disable-next-line */
    }, []);

    return {
        loading,
        record: onBeforeProcessData ? onBeforeProcessData(data) : data,
        refetch: () => fetchResource(filter)
    };
}

export default useGetOneQuery;
