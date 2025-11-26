import { useState, useRef } from 'react';
import { useEffectAsync } from '@/hooks/MyHooks';
import { useParams } from 'react-router-dom';
import RequestUtils from '@/utils/RequestUtils';
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import { GATEWAY, SUCCESS_CODE } from '@/configs';
import RestEditModal from '@/components/RestLayout/RestEditModal';
import FormHidden from '@/components/form/FormHidden';
import { Row, Col, message } from 'antd';
import FormInput from '@/components/form/FormInput';
import FormTextArea from '@/components/form/FormTextArea';
import FormJoditEditor from '@/components/form/FormJoditEditor';
import CustomButton from '@/components/CustomButton';
import { useCallback } from 'react';
import FormInfiniteCategory from '@/components/form/SelectInfinite/FormInfiniteCategory';
import ImageUploader from '@/components/common/File/ImageUploader';
import InfiniteFaq from '@/components/form/SelectInfinite/InfiniteFaq';

const ProductEdit = () => {

  const { id } = useParams();
  const editorRef = useRef(null);

  const [ mContent, setContent ] = useState({ images: [] });
  useEffectAsync(async () => {
    const { data, errorCode } = await RequestUtils.Get("/product/find-by-id", { id });
    if(errorCode !== SUCCESS_CODE) {
      return;
    }
    const { name, images } = data;
    for(let image of images) {
      image.url = String(GATEWAY).concat(image.fileName);
      delete image.fileName;
    }
    setContent({images, name, ...(data?.content ?? {})});
  }, [id]);

  const insertImageToEditor = (url) => {
    if (editorRef.current) {
      editorRef.current.insertImage(url);
    }
  };

  const onUpdateFeaturedImage = useCallback(async (imageId) => {
    RequestUtils.Post("/product/image-featured/" + imageId);
  }, []);

  const onUpdateSlideImage = useCallback(async (imageId, checked) => {
    RequestUtils.Post("/product/image-slide", { imageId, checked, productId: id });
  }, [id]);

  const onSubmit = useCallback(async (values) => {
    const { images, ...body } = values;
    const { message: MEG, data, errorCode } = await RequestUtils.Post("/product/update-content", {
      productId: id,
      ...body
    });
    if(errorCode === 200) {
      setContent(pre => ({...pre, ...data }));
    }
    message.info(MEG);
  }, [ id ]);

  return (
    <>
      <Helmet>
        <title>Sửa nội dung sản phẩm</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: 'Sản phẩm' }, { title: mContent?.name ?? 'Thêm mới nội dung' }]}
      />
      <RestEditModal
        record={mContent}
        updateRecord={(values) => setContent(preVal => ({...preVal, ...values}))}
        onSubmit={onSubmit}
      >
        <Row gutter={16} style={{ marginTop: 20 }}>
          <Col md={24} xs={24}>
            <FormHidden name={'id'} />
            <FormHidden name={'content'} />
          </Col>
          <Col md={12} xs={24}>
            <FormInput
              required
              label="Tiêu đề"
              name="title"
              placeholder={"Nhập tiêu đề"}
            />
            <FormInput
              required
              label="Url tùy chỉnh"
              name="slug"
              placeholder={"Nhập url cho web"}
            />
            <FormTextArea 
              required
              label="Mô tả"
              name="description"
              placeholder={"Nhập mô tả"}
            />
            <FormJoditEditor 
              name="content"
              initContent={mContent?.content ?? ''}
              ref={editorRef}
            />
            <CustomButton 
              title='Cập nhật'
              htmlType="submit"
              style={{marginTop: 20}}
            />
          </Col>
          <Col md={12} xs={24}>
            <FormInfiniteCategory 
              required
              mode="multiple"
              label="Danh mục"
              name='listCategories'
              placeholder={"Chọn nhiều danh mục"}
            />
            <InfiniteFaq 
              mode="multiple"
              label="FAQ"
              name='listFaqs'
              placeholder={"Chọn nhiều faq"}
            />
            <ImageUploader
              onBeforeSubmitMultiPart={(formData) => {
                formData.append('productId', id);
                return formData;
              }}
              title='Tải lên ảnh sản phẩm'
              apiUploadMultiPart="/product/upload-multi-part"
              apiUploadUrlFile="/product/upload-url"
              onClickAddImageToContent={insertImageToEditor}
              onToggleFeatured={onUpdateFeaturedImage}
              onToggleSlideShow={onUpdateSlideImage}
            />
          </Col>
        </Row>
      </RestEditModal>
    </>
  )
};

export default ProductEdit;