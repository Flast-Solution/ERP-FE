import { SUCCESS_CODE } from '@/configs';
import { RequestUtils } from '@flast-erp/core/utils';

const LeadService = {
  fetchByPhone: async (phone) => {
    const { data, errorCode } = await RequestUtils.Get("/data/find-by-phone", { phone });
    const error = errorCode !== SUCCESS_CODE;
    return [ error, data ];
  },
  createLead: async (values) => {
    const { data, errorCode } = await RequestUtils.Post("/data/create", values);
    return { error: errorCode !== SUCCESS_CODE, data };
  }
};

export default LeadService;