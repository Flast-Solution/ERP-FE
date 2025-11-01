/**************************************************************************/
/*  LeadForm.js                                                           */
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

import { useState, useEffect, useContext } from 'react';
import { Row, Col, Tag, List, Button } from 'antd';
import FormHidden from 'components/form/FormHidden';
import CustomButton from 'components/CustomButton';
import FormInput from 'components/form/FormInput';
import FormSelect from 'components/form/FormSelect';
import Dragger from 'antd/es/upload/Dragger';
import FormTextArea from 'components/form/FormTextArea';
import { CHANNEL_SOURCE } from 'configs/localData';
import RequestUtils from 'utils/RequestUtils';
import FormSelectInfiniteProduct from 'components/form/SelectInfinite/FormSelectInfiniteProduct';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { arrayEmpty, arrayNotEmpty } from 'utils/dataUtils';
import { DeleteOutlined } from '@ant-design/icons';

const LeadForm = ({
  listServices = [],
  listSale = []
}) => {

  const { record, updateRecord } = useContext(FormContextCustom);
  const [province, setListProvince] = useState([]);
  const [fileUploads, setFileList] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);

  useEffect(() => {
    if (arrayNotEmpty(record?.fileUrls)) {
      setFileUrls(record.fileUrls);
    }
  }, [record]);

  useEffect(() => {
    RequestUtils.GetAsList('/province/find', { id: 0 }).then(setListProvince);
  }, []);

  useEffect(() => {
    updateRecord({ fileUploads })
    /* eslint-disable-next-line */
  }, [fileUploads]);

  const handleChange = ({ fileList }) => setFileList(prev => {
    const newFiles = fileList.filter(
      file => !prev.some(f => f.uid === file.uid)
    );
    return [...prev, ...newFiles];
  })

  const handleRemove = (file) => {
    const newFileList = fileUploads.filter(f => f.uid !== file.uid);
    setFileList(newFileList);
  };

  /* Tải file mẫu */
  const props = {
    multiple: true,
    beforeUpload: () => false,
    fileList: fileUploads,
    onChange: handleChange,
    onRemove: handleRemove,
    showUploadList: false
  }

  return (
    <Row gutter={16} style={{ marginTop: 20 }}>
      <FormHidden name={'id'} />
      <Col md={24} xs={24}>
        <FormInput
          required
          label="Họ tên"
          name="customerName"
          placeholder={"Nhập họ tên"}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormInput
          required
          label="Số điện thoại"
          name="customerMobile"
          placeholder={"Số điện thoại"}
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          required
          name="provinceName"
          label="Tỉnh / TP"
          placeholder="Chọn Tỉnh / TP"
          resourceData={province || []}
          valueProp="name"
          titleProp="name"
        />
      </Col>
      <Col md={24} xs={24}>
        <FormSelect
          required
          name="source"
          label="Nguồn"
          placeholder="Chọn Nguồn"
          resourceData={CHANNEL_SOURCE}
          valueProp="id"
          titleProp="name"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          required
          name="serviceId"
          label="Dịch vụ"
          placeholder="Chọn dịch vụ"
          resourceData={listServices}
          valueProp="id"
          titleProp="name"
        />
      </Col>
      <Col md={12} xs={24}>
        <FormSelectInfiniteProduct
          required
          name="productId"
          label="Sản phẩm"
          placeholder="Chọn sản phẩm"
          valueProp="id"
          titleProp="name"
        />
      </Col>
      <Col md={12} xs={24} style={{ marginTop: 15 }}>
        <FormInput
          required={false}
          label="Email"
          name="customerEmail"
          placeholder={"Nhập Email"}
        />
      </Col>
      <Col md={12} xs={24} style={{ marginTop: 15 }}>
        <FormInput
          required={false}
          label="Facebook"
          name="customerFacebook"
          placeholder={"Nhập Facebook"}
        />
      </Col>
      <Col md={24} xs={24} style={{ marginBottom: 10 }}>
        <FormSelect
          required
          name="saleId"
          label="Nhân viên phụ trách"
          placeholder="Chọn nhân viên"
          resourceData={listSale}
          valueProp="id"
          titleProp="name"
        />
      </Col>
      <Col md={24} xs={24} style={{ marginTop: 10 }}>
        <Dragger {...props}>
          <p className="ant-upload-text">Tải file mẫu</p>
          <p className="ant-upload-drag-icon">
            Bấm vào đây để tải file mẫu của khách hàng
          </p>
        </Dragger>
      </Col>
      <Col span={24}>
        <List
          style={{ display: arrayEmpty(fileUploads) ? 'none' : 'grid' }}
          locale={{ emptyText: <></> }}
          dataSource={fileUploads}
          renderItem={file => <RenderFileItem file={file} handleRemove={handleRemove} />}
        />
        <div style={{ marginTop: arrayEmpty(fileUrls) ? 0 : 20 }}>
          {fileUrls.map((file, key) => (<Tag key={key}>{file}</Tag>))}
        </div>
      </Col>
      <Col md={24} xs={24} style={{ marginTop: 40 }}>
        <FormTextArea
          rows={3}
          name="noted"
          label="Ghi chú đơn"
          placeholder="Nhập ghi chú"
        />
      </Col>
      <Col md={24} xs={24}>
        <CustomButton
          htmlType="submit"
          title="Hoàn thành"
          color="danger"
          variant="solid"
        />
      </Col>
    </Row>
  )
}

const RenderFileItem = ({ file, handleRemove }) => (
  <List.Item
    actions={[
      <Button
        type="link"
        danger
        icon={<DeleteOutlined />}
        onClick={() => handleRemove(file)}
      >
        Xóa
      </Button>
    ]}
  >
    <List.Item.Meta
      title={file.name}
      description={`Kích thước: ${Math.round(file.size / 1024)} KB`}
    />
  </List.Item>
);

export default LeadForm;