import { Col } from "antd";
import FormHidden from '@flast-erp/core/components/form/FormHidden';
import FormInput from '@flast-erp/core/components/form/FormInput';
import { FormListStyles } from "@/css/global";

const DefectItem = ({ field }) => {
  return (
    <FormListStyles gutter={[16, 16]}>
      <FormHidden name={[field.name, 'idQcDefect']} />
      <Col md={12} xs={24}>
        <FormInput
          required
          name={[field.name, 'defectName']}
          label="Tên lỗi"
          placeholder="Tên lỗi"
        />
      </Col>

      <Col md={12} xs={24}>
        <FormInput
          required
          name={[field.name, 'quantity']}
          label="Số lượng"
          placeholder="Số lượng"
        />
      </Col>

      <Col md={12} xs={24}>
        <FormInput
          name={[field.name, 'imageUrl']}
          label="Link ảnh"
          placeholder="Link ảnh"
        />
      </Col>

      <Col md={12} xs={24}>
        <FormInput
          required
          name={[field.name, 'severity']}
          label="Mức độ"
          placeholder="Mức độ"
        />
      </Col>
    </FormListStyles>
  );
};
export default DefectItem