/**************************************************************************/
/*  QcService.js                                                          */
/**************************************************************************/

import { SUCCESS_CODE } from "@/configs";
import RequestUtils from "@flast-erp/core/utils/RequestUtils";

const QcService = {
  // QC Criteria
  async fetchCriteria(params) {
    return await RequestUtils.Get("/qms/qc-criteria/list", params);
  },
  async fetchCriteriaPaging(params) {
    return await RequestUtils.Get("/qms/qc-criteria/fetch", params);
  },
  async addCriteria(data) {
    return await RequestUtils.Post("/qms/qc-criteria/save", data);
  },
  async updateCriteria(data) {
    return await RequestUtils.Post("/qms/qc-criteria/save", data);
  },
  async deleteCriteria(id) {
    return await RequestUtils.Post("/qms/qc-criteria/delete", { id });
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
    return await RequestUtils.Get("/qms/qc-check-list/fetch", params);
  },
  async addChecklist(data) {
    return await RequestUtils.Post("/qms/qc-check-list/save", data);
  },
  async updateChecklist(data) {
    return await RequestUtils.Post("/qms/qc-check-list/save", data);
  },
  async deleteChecklist(id) {
    return await RequestUtils.Post("/qms/qc-check-list/delete", { id });
  },
  async findChecklistById(id) {
    const { data, errorCode, message } = await RequestUtils.Get("/qms/qc-checklist/find-id", { id });
    if (errorCode === SUCCESS_CODE) {
      return [null, data];
    }
    return [message, null];
  },

  // Mapping Criteria to Checklist
  async addCriteriaToChecklist(checkListId, idCriteriaList) {
    return await RequestUtils.Post("/cms/qc-checklist/add-criteria", { checkListId, idCriteriaList });
  },

  // QC Defect
  async fetchDefect(params) {
    return await RequestUtils.Get("/qms/qc-defect/fetch", params);
  },
  async addDefect(data) {
    return await RequestUtils.Post("/qms/qc-defect/save", data);
  },
  async updateDefect(data) {
    return await RequestUtils.Post("/qms/qc-defect/save", data);
  },
  async deleteDefect(id) {
    return await RequestUtils.Post("/qms/qc-defect/delete", { id });
  }
};

export default QcService;
