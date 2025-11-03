import { Image } from 'antd';
import { useState } from 'react';

const CustomImage = ({ src, fallbackSrc = '/img/image_not_found.png', ...props }) => {
  const [ imgSrc, setImgSrc ] = useState(src);
  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };
  return <Image src={imgSrc} onError={handleError} {...props} />;
};

export default CustomImage;