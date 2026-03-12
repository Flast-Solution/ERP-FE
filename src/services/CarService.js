import { SUCCESS_CODE } from 'configs';
import { arrayNotEmpty } from 'utils/dataUtils';
import RequestUtils from 'utils/RequestUtils';

const CarService = {
  allData: {},
  empty() {
    this.allData = {};
  },
  getAllDiemTra() {
    return this.allData["Điểm trả"] ?? [];
  },
  getAllDiemDon() {
    return this.allData["Điểm đến"] ?? [];
  },
  async fetch() {
    if (arrayNotEmpty(this.allData)) {
      return this.allData;
    }
    const { data, errorCode } = await RequestUtils.Get("/tickes-bus/fetch-address");
    if (errorCode !== SUCCESS_CODE) {
      return [];
    }
    this.allData = data;
    return this.allData;
  }
}

export default CarService;