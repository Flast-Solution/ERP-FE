/**************************************************************************/
/*  QcService.js                                                          */
/**************************************************************************/

import { SUCCESS_CODE } from "@/configs";
import RequestUtils from "@erp/shared/dist/utils/RequestUtils";

const QcService = {
  // QC Criteria
  async fetchCriteria(params) {
    return await RequestUtils.Get("/qc-criteria/list", params);
  },
  async addCriteria(data) {
    return await RequestUtils.Post("/qc-criteria/add", data);
  },
  async updateCriteria(data) {
    return await RequestUtils.Post("/qc-criteria/update", data);
  },
  async deleteCriteria(id) {
    return await RequestUtils.Post("/qc-criteria/delete", { id });
  },
  async findCriteriaById(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/qc-criteria/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },

  // QC Checklist
  async fetchChecklist(params) {
    return await RequestUtils.Get("/qc-checklist/list", params);
  },
  async addChecklist(data) {
    return await RequestUtils.Post("/qc-checklist/add", data);
  },
  async updateChecklist(data) {
    return await RequestUtils.Post("/qc-checklist/update", data);
  },
  async deleteChecklist(id) {
    return await RequestUtils.Post("/qc-checklist/delete", { id });
  },
  async findChecklistById(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/qc-checklist/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },

  // Mapping Criteria to Checklist
  async addCriteriaToChecklist(checkListId, criteriaIds) {
    return await RequestUtils.Post("/qc-checklist/add-criteria", { checkListId, criteriaIds });
  }
};

export default QcService;
