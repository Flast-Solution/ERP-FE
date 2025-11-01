/**************************************************************************/
/*  useDeleteMutation.js                                                  */
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

import { useState } from "react";
import { InAppEvent } from "utils/FuseUtils";
import RequestUtils from "utils/RequestUtils";

const useDeleteMutation = () => {

    const [loading, setLoading] = useState(false);
    const deleteRecord = async ({ api, input, update }) => {
        setLoading(true);
        const { success, message, data } = await RequestUtils.Post('/'.concat(api), {}, input);
        if (!success) {
            InAppEvent.normalError("Lỗi xoá nội dung .!");
            return;
        }
        setLoading(false);
        update && update(data);
        InAppEvent.normalSuccess(message);
    }

    return [
        deleteRecord,
        loading
    ]
}

export default useDeleteMutation;