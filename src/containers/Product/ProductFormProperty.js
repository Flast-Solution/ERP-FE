/**************************************************************************/
/*  ProductFormProperty.js                                                */
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

import { useContext, useMemo } from 'react';
import { Col, Form } from 'antd';
import FormSelectAPI from 'components/form/FormSelectAPI';
import { FormListStyles } from "css/global";
import ProductAttrService from 'services/ProductAttrService';
import { FormContextCustom } from 'components/context/FormContextCustom';
import _ from "lodash";

const ProductFormProperty = ({ field }) => {
  const { name } = field || { name: 0 };
  const { record } = useContext(FormContextCustom);
  return <>
    <FormListStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormSelectAPI
          required
          showSearch
          fnLoadData={(filter) => ProductAttrService.loadAll(filter)}
          onData={(values) => _.merge(values, record?.dRe?.attrs ?? [])}
          apiPath={"attributed/fetch"}
          apiAddNewItem='attributed/save'
          name={[name, 'attributedId']}
          placeholder="Tên thuộc tính"
        />
      </Col>
      <Col md={12} xs={24}>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, curValues) =>
            prevValues.listProperties[name]?.attributedId !== curValues.listProperties[name]?.attributedId
          }
        >
          {({ getFieldValue }) => {
            let listProperties = getFieldValue('listProperties');
            const attributedId = listProperties[name]?.attributedId ?? '';
            const filter = { attributedId, forceUpdate: attributedId !== '' };
            return (
              <FormPropertiesValue
                filter={filter}
                name={name}
              />
            )
          }}
        </Form.Item>
      </Col>
    </FormListStyles>
  </>
}

const FormPropertiesValue = ({ name, filter }) => {
  const contentForm = useMemo(() => {
    return (
      <FormSelectAPI
        mode='multiple'
        searchKey='value'
        required
        showSearch
        apiPath='attributed/fetch-value-by-id'
        apiAddNewItem='attributed/save-value-by-id'
        name={[name, 'attributedValueId']}
        placeholder="Gía trị thuộc tính"
        titleProp='value'
        valueProp='id'
        createDefaultValues={{
          attributedId: filter?.attributedId || null
        }}
        filter={filter}
        fnLoadData={(f) => ProductAttrService.fetchValueByAttributedId(f.attributedId)}
      />
    )
    /* eslint-disable-next-line */
  }, [name, filter]);
  return contentForm;
};

export default ProductFormProperty;