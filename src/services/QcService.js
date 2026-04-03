/**************************************************************************/
/*  QcService.js                                                          */
/**************************************************************************/

import { SUCCESS_CODE } from "@/configs";
import RequestUtils from "@flast-erp/core/utils/RequestUtils";

const QcService = {
  // QC Criteria
  async fetchCriteria(params) {
    return await RequestUtils.Get("/cms/qc-criteria/list", params);
  },
  async addCriteria(data) {
    return await RequestUtils.Post("/cms/qc-criteria", data);
  },
  async updateCriteria(data) {
    return await RequestUtils.Post("/cms/qc-criteria/update", data);
  },
  async deleteCriteria(id) {
    return await RequestUtils.Post("/cms/qc-criteria/delete", { id });
  },
  async findCriteriaById(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/cms/qc-criteria/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },

  // QC Checklist
  async fetchChecklist(params) {
    return await RequestUtils.Get("/cms/qc-checklist/list", params);
  },
  async addChecklist(data) {
    return await RequestUtils.Post("/cms/qc-checklist/add", data);
  },
  async updateChecklist(data) {
    return await RequestUtils.Post("/cms/qc-checklist/update", data);
  },
  async deleteChecklist(id) {
    return await RequestUtils.Post("/cms/qc-checklist/delete", { id });
  },
  async findChecklistById(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/cms/qc-checklist/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },

  // Mapping Criteria to Checklist
  async addCriteriaToChecklist(checkListId, criteriaIds) {
    return await RequestUtils.Post("/cms/qc-checklist/add-criteria", { checkListId, criteriaIds });
  }
};

export default QcService;
