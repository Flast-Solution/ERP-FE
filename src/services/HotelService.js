import { SUCCESS_CODE } from 'configs';
import { arrayNotEmpty } from 'utils/dataUtils';
import RequestUtils from 'utils/RequestUtils';

const HotelService = {
  allData: [],
  empty () {
    this.allData = [];
  },
  fetchAddressByName(name) {
    return this.allData.find(i => i.name === name)?.address ?? '';
  },
  getAll () {
    return this.allData;
  },
  async fetch() {
    if(arrayNotEmpty(this.allData)) {
      return this.allData;
    }
    const { data, errorCode } = await RequestUtils.Get("/tickes-hotel/list-hotel");
    if(errorCode !== SUCCESS_CODE) {
      return [];
    }
    this.allData = data;
    return this.allData;
  }
}

export default HotelService;