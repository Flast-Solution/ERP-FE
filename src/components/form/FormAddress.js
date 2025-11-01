/**************************************************************************/
/*  FormAddress.js                                                        */
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

import { Form, Col } from "antd";
import FormInput from "components/form/FormInput";
import FormSelect from "components/form/FormSelect";
import FormSelectInfiniteProvince from "components/form/SelectInfinite/FormSelectInfiniteProvince";
import { useEffectAsync } from "hooks/MyHooks";
import React, { useState } from "react";
import RequestUtils from "utils/RequestUtils";

const FormAddress = () => {
  return <>
    <Col md={12} xs={24}>
      <FormSelectInfiniteProvince
        name="provinceId"
        label="Tỉnh / TP"
        required
        placeholder="Tỉnh / TP"
        initialFilter={{ id: 0 }}
      />
    </Col>
    <Col md={12} xs={24}>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, curValues) => prevValues.provinceId !== curValues.provinceId}
      >
        {({ getFieldValue }) => (
          <FormWard
            parentId={getFieldValue('provinceId')}
          />
        )}
      </Form.Item>
    </Col>
    <Col md={24} xs={24}>
      <FormInput
        label="Địa chỉ"
        name="address"
        required
        placeholder="Địa chỉ"
      />
    </Col>
  </>
}

const FormWard = React.memo(({ parentId }) => {

  const [datas, setData] = useState([]);
  useEffectAsync(async () => {
    if (!parentId) {
      return;
    }
    const wards = await RequestUtils.GetAsList("/province/find", { id: parentId });
    setData(wards);
  }, [parentId]);

  return (
    <FormSelect
      name="wardId"
      label="Phường / Xã"
      required
      resourceData={datas}
      placeholder="Phường / Xã"
    />
  );
});

export default FormAddress;