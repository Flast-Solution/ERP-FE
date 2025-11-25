import { useState, useRef } from 'react';
import { useEffectAsync } from '@/hooks/MyHooks';
import RequestUtils, { SUCCESS_CODE } from '@/utils/RequestUtils';
import { Helmet } from "react-helmet";
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import RestEditModal from '@/components/RestLayout/RestEditModal';
import FormHidden from '@/components/form/FormHidden';
import { Row, Col, message } from 'antd';
import FormInput from '@/components/form/FormInput';
import FormTextArea from '@/components/form/FormTextArea';
import FormJoditEditor from '@/components/form/FormJoditEditor';
import CustomButton from '@/components/CustomButton';
import { useCallback } from 'react';
import ImageUploader from '@/components/common/File/ImageUploader';
import { useQueryParams } from 'hooks/useQueryParams';
import logger from '@/logger';
import FormCategoryPost from '@/components/form/SelectInfinite/FormCategoryPost';
import MediaService from '@/services/MediaService';

const LOGGER_TAG = '[pages/post/Edit.js]';
const PostEdit = () => {

  const { get } = useQueryParams();
  const id = get('id');
  const editorRef = useRef(null);

  const [ sectionId, setSectionId ] = useState();
  const [ mContent, setContent ] = useState({ images: [] });

  useEffectAsync(async () => {
    if(!id) {
      setSectionId(Math.floor(new Date().getTime() / 1000));
      return;
    }

    const { data, errorCode } = await RequestUtils.Get("/page-content/find-by-id", { id });
    if(errorCode !== SUCCESS_CODE) {
      return;
    }

    const images = await MediaService.fetchById(data.id, "page", data.image || '');
    logger.info(LOGGER_TAG, { data, images });
    setContent({images, ...data});
  }, [ id ], () => {
    logger.info(LOGGER_TAG, 'reset sectionId !');
    setSectionId(Math.floor(new Date().getTime() / 1000));
  });

  const insertImageToEditor = (url) => {
    if (editorRef.current) {
      editorRef.current.insertImage(url);
    }
  };

  const onUpdateFeaturedImage = useCallback(async (imageId) => {
    RequestUtils.Post("/page-content/image-featured/" + imageId);
  }, []);

  const onSubmit = useCallback(async (values) => {
    const { images, ...body } = values;
    const { message: MEG, data, errorCode } = await RequestUtils.Post("/page-content/save/" + sectionId, body);
    if(errorCode === 200) {
      const images = await MediaService.fetchById(data.id, "page", data.image || '');
      setContent(pre => ({...pre, ...data, images }));
    }
    message.info(MEG);
  }, [ sectionId ]);

  return (
    <>
      <Helmet>
        <title>Sửa nội dung tin tức</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: 'Tin tức' }, { title: mContent?.name ?? 'Thêm mới nội dung' }]}
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
          <Col md={14} xs={24}>
            <Row gutter={16}>
              <Col md={12} xs={24}>
                <FormInput
                  required
                  label="Tên bài viết"
                  name="name"
                  placeholder={"Nhập tên"}
                />
              </Col>
              <Col md={12} xs={24}>
                <FormCategoryPost 
                  required
                  label="Danh mục"
                  placeholder={"Chọn danh mục"}
                />
              </Col>
            </Row>
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
              name="desc"
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
          <Col md={8} xs={24}>
            <ImageUploader
              showImgSlide={false}
              imageSize={70}
              onBeforeSubmitMultiPart={(formData) => {
                if(id) {
                  formData.append('objectId', id);
                }
                formData.append('sectionId', sectionId);
                formData.append('objectType', "page");
                return formData;
              }}
              title='Tải lên hình ảnh'
              apiUploadMultiPart="/page-content/upload-multi-part"
              onClickAddImageToContent={insertImageToEditor}
              onToggleFeatured={onUpdateFeaturedImage}
            />
          </Col>
        </Row>
      </RestEditModal>
    </>
  )
};

export default PostEdit;