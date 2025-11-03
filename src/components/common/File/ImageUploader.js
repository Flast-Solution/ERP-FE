import React, { useContext, useEffect, useState } from 'react';
import jwtService from 'utils/jwtService';
import {
  Upload,
  Button,
  Checkbox,
  List,
  Input,
  message,
  Space,
  Row,
  Col,
} from 'antd';
import { DeleteOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { isPositiveInteger } from 'utils/tools';
import RequestUtils from 'utils/RequestUtils';
import { GATEWAY, SUCCESS_CODE } from 'configs';
import { FormContextCustom } from 'components/context/FormContextCustom';
import CustomImage from 'components/common/CustomImage';

const ImageUploader = ({
  apiUploadMultiPart,
  apiUploadUrlFile,
  title = 'Upload ảnh sản phẩm',
  onBeforeSubmitMultiPart = (values) => values,
  onBeforeSubmitUrl = (values) => values,
  onClickAddImageToContent = (url) => url,
  onToggleFeatured = (id) => id,
  onToggleSlideShow = (id, checked) => true
}) => {

  const { record } = useContext(FormContextCustom);
  const [ images, setImages ] = useState([]);
  const [ showUrlInput, setShowUrlInput ] = useState(false);
  const [ urlInputValue, setUrlInputValue ] = useState('');

  useEffect(() => {
    setImages(record?.images ?? []);
  }, [record])

  const handleFileChange = ({ file, fileList }) => {
    const newImage = {
      id: String(Date.now()),
      url: URL.createObjectURL(file),
      name: file.name,
      isFeatured: false,
      isSlideshow: false,
      fromUpload: true,
      originFile: file
    };
    setImages(prev => {
      /* Tránh thêm file trùng (dựa trên name + size) */
      const exists = prev.some(
        img => img.name === file.name && img.size === file.size
      );
      if (exists) return prev;
      return [newImage, ...prev];
    })
  };

  const handleAddByUrl = () => {
    setShowUrlInput(true);
  };

  const handleUrlSubmit = async () => {
    if (!urlInputValue.trim()) {
      message.warning('Vui lòng nhập URL hình ảnh!');
      return;
    }
    const newImage = {
      url: urlInputValue.trim(),
      name: urlInputValue.trim().split('/').pop(),
      isFeatured: false,
      isSlideshow: false,
      fromUpload: true
    };

    const { errorCode, data } = await RequestUtils.Post(apiUploadUrlFile, { method: 'POST', body: onBeforeSubmitUrl(newImage)});
    if (errorCode !== 200) {
      message.error('Update file url thất bại');
      return;
    }
    setImages(prev => [...prev, data]);
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  const handleRemove = (id) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleToggleFeatured = (id) => {
    setImages(images.map(img => ({
      ...img,
      isFeatured: img.id === id ? !img.isFeatured : img.isFeatured
    })));
    onToggleFeatured(id);
  };

  const handleToggleSlide = (id, checked) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, isSlideshow: checked } : img
    ));
    onToggleSlideShow(id, checked);
  };

  const handleUpload = (id) => {
    const image = images.find(img => img.id === id);
    if (image && image.fromUpload && image.originFile) {
      uploadToServer(image);
    }
  };

  const uploadToServer = async (image) => {

    const formData = new FormData();
    formData.append('image', image.originFile, image.name);
    formData.append('isFeatured', image.isFeatured);
    formData.append('isSlideshow', image.isSlideshow);

    const response = await fetch(String(GATEWAY).concat(apiUploadMultiPart), { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtService.getAccessToken()}`,
      },
      body: onBeforeSubmitMultiPart(formData)
    });
    if (!response.ok) {
      message.error('Upload thất bại!');
      return;
    }

    const { data, errorCode, message: MSG } = await response.json();
    if(errorCode !== SUCCESS_CODE) {
      message.error(MSG);
      return;
    }

    const { fileName, ...mImage } = data;
    /* reset originFile = null */
    setImages(prev => prev.map(img =>
      img.id === image.id ?
      {
        ...mImage, 
        url: String(GATEWAY).concat(fileName), 
        originFile: null, 
        fromUpload: false 
      } : img
    ));
    if (image.url && image.fromUpload) {
      URL.revokeObjectURL(image.url);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h3>{title}</h3>

      {/* Thêm ảnh và URL */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: '4px', marginBottom: '16px', padding: '12px' }}>
        <Row justify="space-between" align="middle">
          <Space>
            <Upload
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
            >
              <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                Thêm ảnh...
              </Button>
            </Upload>
            <Button type="default" style={{ backgroundColor: '#f5a623', borderColor: '#f5a623', color: 'white' }}>
              Hủy
            </Button>
          </Space>
          <Button type="primary" style={{ backgroundColor: '#4096ff', borderColor: '#4096ff' }} onClick={handleAddByUrl}>
            Thêm Url
          </Button>
        </Row>
      </div>

      {/* Form nhập URL nếu đang mở */}
      {showUrlInput && (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: '4px', marginBottom: '16px', padding: '12px' }}>
          <Input
            placeholder="Nhập URL hình ảnh..."
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onPressEnter={handleUrlSubmit}
            style={{ marginBottom: '8px' }}
          />
          <Space>
            <Button type="primary" onClick={handleUrlSubmit}>
              Xác nhận
            </Button>
            <Button type="default" onClick={() => setShowUrlInput(false)}>
              Hủy
            </Button>
          </Space>
        </div>
      )}

      {/* Danh sách ảnh */}
      <div style={{ border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <List
          dataSource={images}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                border: '1px solid #e8e8e8',
                borderBottom: 'none',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Col span={4}>
                <CustomImage
                  preview={false}
                  src={item.url}
                  alt={item.name}
                  width={80}
                  height={80}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </Col>
              <Col span={12} style={{ paddingLeft: '16px', overflow: 'hidden' }}>
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {item.name}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Checkbox
                    checked={item.isFeatured}
                    onChange={(e) => handleToggleFeatured(item.id)}
                    style={{ marginRight: '16px' }}
                  >
                    Chọn làm ảnh đại diện
                  </Checkbox>
                  <Checkbox
                    checked={item.isSlideshow}
                    onChange={(e) => handleToggleSlide(item.id, e.target.checked)}
                  >
                    Chọn làm ảnh slide
                  </Checkbox>
                </div>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  {item.fromUpload && (
                    <Button
                      icon={<UploadOutlined />}
                      type="primary"
                      size="small"
                      style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                      onClick={() => handleUpload(item.id)}
                    >
                      Tải lên
                    </Button>
                  )}
                  {isPositiveInteger(item.id) && 
                    <Button
                      icon={<PlusOutlined />}
                      danger
                      size="small"
                      onClick={() => onClickAddImageToContent(item.url)}
                    />
                  }
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                    onClick={() => handleRemove(item.id)}
                  />
                </Space>
              </Col>
            </List.Item>
          )}
        />
      </div>
    </div>
  )
};

export default ImageUploader;
