/**************************************************************************/
/*  index.js                                                              */
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
import React, { useCallback, useState } from 'react';
import { Row, Col, message } from 'antd';
import RestEditModal from '@erp/shared/dist/components/RestLayout/RestEditModal';
import FormHidden from '@erp/shared/dist/components/form/FormHidden';
import FormInput from '@erp/shared/dist/components/form/FormInput';
import CustomButton from '@erp/shared/dist/components/CustomButton';
import FormTextArea from '@erp/shared/dist/components/form/FormTextArea';
import RequestUtils, { SUCCESS_CODE } from '@erp/shared/dist/utils/RequestUtils';
import { useEffectAsync } from '@erp/shared/dist/hooks/MyHooks';
import { f5List } from '@erp/shared/dist/utils/dataUtils';
import MediaService from '@/services/MediaService';
import ImageUploader from '@erp/shared/dist/components/common/File/ImageUploader';
import logger from '@/logger';

const LOGGER_TAG = '[container/category/Page.js]';
const MEDIA_TYPE = "category.page";
const FormCatePage = ({ closeModal, data }) => {

  const [ record, setRecord ] = useState({});
  useEffectAsync(async () => {
    const images = await MediaService.fetchById(data.id, MEDIA_TYPE, data.image || '');
    logger.info(LOGGER_TAG, 'IMAGES: ', images);
    setRecord({ 
      ...data,
      images: images,
      sectionId: Math.floor(new Date().getTime() / 1000)
    });
  }, [ data ]);

  const onSubmit = useCallback(async (body) => {
    const { data, message: MEG, errorCode } = await RequestUtils.Post("/category/page/save", body);
    message.info(MEG);
    if(SUCCESS_CODE === errorCode) {
      setRecord(pre => ({...pre, ...data}));
      f5List("category/page/fetch");
    }
  }, []);

  const onUpdateFeaturedImage = useCallback(async (imageId) => {
    RequestUtils.Post("/category/page/image-featured/" + imageId);
  }, []);

  return (
    <RestEditModal
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => setRecord(curvals => ({ ...curvals, ...values }))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <Row gutter={16} style={{ marginTop: 20 }}>
        <Col md={24} xs={24}>
          <FormHidden name={'id'} />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            label="Tên danh mục sản phẩm"
            name="name"
            placeholder={"Nhập tên danh mục sản phẩm"}
          />
        </Col>
        <Col md={12} xs={24}>
          <FormInput
            required
            label="Url (tùy chỉnh)"
            name="slug"
            placeholder={"Nhập Url của danh mục"}
          />
        </Col>
        <Col md={24} xs={24}>
          <FormInput
            required
            label="Tiêu để"
            name="title"
            placeholder={"Nhập tiêu đề"}
          />
        </Col>
        <Col md={24} xs={24}>
          <FormTextArea
            required
            label="Mô tả"
            name="desc"
            placeholder={"Nhập mô tả"}
          />
        </Col>
        <Col md={24} xs={24}>
          <ImageUploader
            onBeforeSubmitMultiPart={(formData) => {
              if(data.id) {
                formData.append('objectId', data.id);
              }
              formData.append('sectionId', record.sectionId);
              formData.append('objectType', MEDIA_TYPE);
              return formData;
            }}
            title='Tải lên ảnh'
            showImgSlide={false}
            apiUploadMultiPart="/category/page/upload-multi-part"
            onToggleFeatured={onUpdateFeaturedImage}
          />
        </Col>
        <Col md={24} xs={24} style={{marginTop: 30}}>
          <CustomButton
            htmlType="submit"
            title="Hoàn thành"
            color="danger"
            variant="solid"
          />
        </Col>
      </Row>
    </RestEditModal>
  )
};

export default FormCatePage;