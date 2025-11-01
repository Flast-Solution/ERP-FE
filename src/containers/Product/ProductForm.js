/**************************************************************************/
/*  ProductForm.js                                                        */
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

import { useState } from 'react';
import { Row, Col, Typography, Form, Modal } from 'antd';
import FormHidden from 'components/form/FormHidden';
import CustomButton from 'components/CustomButton';
import FormSelectAPI from 'components/form/FormSelectAPI';
import FormInput from 'components/form/FormInput';
import FormListAddition from 'components/form/FormListAddtion';
import ProductFormProperty from './ProductFormProperty';
import { DeleteOutlined, EyeOutlined, SwitcherOutlined } from '@ant-design/icons';
import ProductFormPrice from './ProductFormPrice';
import FormSelect from 'components/form/FormSelect';
import { PRODUCT_STATUS } from 'configs/localData';
import Dragger from 'antd/es/upload/Dragger';
import { GATEWAY } from 'configs';
import { FormListFile } from './styles';
import { FormListStyles } from "css/global";
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';

const ProductForm = ({ data, fileActive, setFileActive, setSessionId }) => {

  const [listFile, setListFile] = useState(data?.imageLists || []);
  const [listImage, setListImage] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [detailImage, setDetailImage] = useState('');

  const onUploadMultiple = (fileList) => {
    let formData = new FormData();
    const sessionId = Math.floor(Date.now() / 1000);
    fileList.forEach((file) => {
      formData.append('files', file);
    });
    RequestUtils.Post(`/product/upload-file?sessionId=${sessionId}&productId=${data?.id ? data?.id : ''}`, formData)
      .then(({ data, errorCode }) => {
        setListImage(data?.fileNames || []);
        setSessionId(data?.sessionId);
        if (errorCode !== 200) {
          throw new Error("Upload failed");
        }
        InAppEvent.normalSuccess("Tải file thành công");
      })
      .catch((error) => {
        InAppEvent.normalError("Lỗi tải file");
      });
  };

  /* Tải file mẫu */
  const props = {
    beforeUpload: (file, fileList) => {
      onUploadMultiple(fileList);
      return false;
    }
  }

  /* set mặc định ảnh*/
  const onHandleAvtiveImage = (file) => setFileActive(file);

  /* Xoá ảnh */
  const onHandleDeleteFile = (file) => {
    const params = { file, productId: data?.id };
    RequestUtils.Post('/product/remove-file', {}, params).then(({ errorCode }) => {
      if (errorCode !== 200) {
        throw new Error("Xóa file thất bại");
      }
      InAppEvent.normalSuccess("Xóa file thành công");
      const newListFile = listFile.filter(f => f !== file);
      setListFile(newListFile);
    }).catch((error) => {
      InAppEvent.normalError("Lỗi xóa file");
    });
  }

  return (
    <>
      <Row gutter={16} style={{ marginTop: 20 }}>
        <FormHidden name={'id'} />
        <Col md={24} xs={24}>
          <FormInput
            required
            label="Tên sản phẩm"
            name="name"
            placeholder={"Nhập tên sản phẩm"}
          />
        </Col>

        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            showSearch
            onData={(data) => data ?? []}
            apiPath='service/list'
            apiAddNewItem='product-type/save'
            label="Dịch vụ"
            name="serviceId"
            placeholder="Chọn dịch vụ"
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelectAPI
            required
            apiPath='provider/fetch'
            apiAddNewItem='provider/save'
            onData={(data) => data?.embedded ?? []}
            label="Nhà cung cấp"
            name="providerId"
            placeholder="Chọn nhà cung cấp"
          />
        </Col>

        <Col md={12} xs={24}>
          <FormInput
            label="Đơn vị tính"
            name="unit"
            placeholder={"Nhập đơn vị tính"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormSelect
            required
            resourceData={PRODUCT_STATUS}
            valueProp='value'
            titleProp='text'
            label="Trạng thái"
            name="status"
            placeholder={"Chọn trạng thái"}
          />
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thiết lập sản phẩm (Có tính nhận diện tồn kho)</span>
          </Typography.Title>
          <FormListAddition
            name="listProperties"
            textAddNew="Thêm mới thuộc tính"
          >
            <ProductFormProperty />
          </FormListAddition>
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thiết lập giá bán</span>
          </Typography.Title>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, curValues) =>
              prevValues.listProperties !== curValues.listProperties
            }
          >
            {({ getFieldValue }) => {
              let listProperties = getFieldValue('listProperties');
              return (
                <ProductFormPrice listProperties={listProperties} />
              )
            }}
          </Form.Item>
        </Col>

        <Col md={24} xs={24}>
          <Typography.Title level={5}>
            <SwitcherOutlined />
            <span style={{ marginLeft: 20 }}>Thông tin mở rộng</span>
          </Typography.Title>
          <FormListAddition
            name="listOpenInfo"
            textAddNew="Thêm mới"
            showBtnInLeft={false}
          >
            <FormOpenInfo />
          </FormListAddition>
        </Col>

        <Col md={24} xs={24} style={{ marginBottom: 30 }}>
          <Dragger {...props} multiple={true} showUploadList={false} style={{ border: '2px dashed #f2f1fc' }}>
            <FormListFile>
              <div className='upload-image-wrapper' onClick={(e) => e.stopPropagation()}>
                {[...listFile, ...listImage]?.map((file, i) => (
                  <div className='selectedImage' key={i}>
                    <div className='uploadImage'>
                      <img loading='lazy' fetchPriority='high' src={`${GATEWAY}${file}`} width={100} height={100} alt="" />
                      <div className='overlay'>
                        <span className='anticon anticon-eye' onClick={() => {
                          setIsOpen(true);
                          setDetailImage(file)
                        }}>
                          <EyeOutlined />
                        </span>
                        <span className='anticon anticon-delete' onClick={() => onHandleDeleteFile(file)}>
                          <DeleteOutlined />
                        </span>
                        <div className={`lbSetDefault ${file === (fileActive || data?.image) ? 'active' : ''}`} onClick={() => onHandleAvtiveImage(file)}>Mặc định</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20 }}>
                <p align="center" style={{ margin: 0 }}>
                  <img src="/img/upload-image.png" width={67} height={50} alt="upload" />
                </p>
                <p>Tải file hình ảnh</p>
              </div>
            </FormListFile>
          </Dragger>
        </Col>

        <Col md={24} xs={24}>
          <div style={{ display: 'flex', justifyContent: 'end' }}>
            <CustomButton
              htmlType="submit"
              title="Hoàn thành"
              color="danger"
              variant="solid"
            />
          </div>
        </Col>
      </Row>

      <Modal
        style={{ top: 80 }}
        open={isOpen}
        footer={false}
        onCancel={() => setIsOpen(false)}
        width={560}
      >
        <div>
          <img loading='lazy' style={{ width: '100%', objectFit: 'cover' }} fetchPriority='high' src={`${GATEWAY}${detailImage}`}
            width={472} height={454} alt=""
          />
        </div>
      </Modal>
    </>
  )
}

const FormOpenInfo = ({ field }) => {
  const { name } = field || { name: 0 };
  return (
    <FormListStyles gutter={16}>
      <Col md={6} xs={24}>
        <FormInput
          name={[name, 'name']}
          required
          placeholder={"Tên trường"}
        />
      </Col>
      <Col md={14} xs={24}>
        <FormInput
          required
          name={[name, 'value']}
          placeholder="Gía trị"
        />
      </Col>
      <Col md={4} xs={24}>
        <FormInput
          name={[name, 'icon']}
          required={false}
          placeholder={"Icon"}
        />
      </Col>
    </FormListStyles>
  )
}

export default ProductForm;