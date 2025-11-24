import { GATEWAY } from '@/configs';
import RequestUtils, { SUCCESS_CODE } from '@/utils/RequestUtils';

const MediaService = {
  fetchById: async (objectId, objectType, featureImage) => {
    if(!objectId) {
      return [];
    }
    
    const { data, errorCode } = await RequestUtils.Get("/media/find", { 
      objectId,
      objectType
     });
    if(errorCode !== SUCCESS_CODE) {
      return [];
    }

    let images = [];
    for(let image of data) {
      const { id, fileName } = image;
      let isFeatured = fileName === featureImage;
      images.push({ isFeatured, id, url: GATEWAY + fileName, fromUpload: false });
    }
    return images;
  }
};

export default MediaService;