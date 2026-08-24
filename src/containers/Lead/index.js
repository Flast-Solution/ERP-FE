/**************************************************************************/
/*  index.js                                                          		*/
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useState } from 'react';
import { Form } from 'antd';
import { RestEditModal } from '@flast-erp/core/components';

import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { f5List } from '@flast-erp/core/utils';
import { HASH_MODAL_CLOSE } from '@/configs';
import moment from 'moment';
import dayjs from 'dayjs';
import LeadForm from './LeadForm';
import { resolveUploadFilename } from '@/containers/PreviewModal/uploadUtils';

const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const API_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const LEGACY_SLASH_DATE_FORMAT = 'YYYY/MM/DD HH:mm:ss';

const toDatePickerValue = (value) => {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value;
  if (moment.isMoment(value)) return dayjs(value.toDate());
  const parsed = moment(
    value,
    [DISPLAY_DATE_FORMAT, API_DATE_FORMAT, LEGACY_SLASH_DATE_FORMAT, moment.ISO_8601],
    true,
  );
  return parsed.isValid() ? dayjs(parsed.toDate()) : undefined;
};

const formatApiDate = (value, outputFormat = API_DATE_FORMAT) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value.format(outputFormat);
  if (moment.isMoment(value)) return value.format(outputFormat);
  const parsed = moment(
    value,
    [DISPLAY_DATE_FORMAT, API_DATE_FORMAT, LEGACY_SLASH_DATE_FORMAT, moment.ISO_8601],
    true,
  );
  return parsed.isValid() ? parsed.format(outputFormat) : value;
};

const normalizeEmptyPayloadValues = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value.trim() ? value : null;
  if (Array.isArray(value)) {
    return value.length ? value.map(normalizeEmptyPayloadValues) : null;
  }
  if (Object.prototype.toString.call(value) === '[object Object]') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        normalizeEmptyPayloadValues(nestedValue),
      ]),
    );
  }
  return value;
};

const normalizeWorkflowProcessIds = (item = {}) => Array.from(new Set([
  ...(Array.isArray(item.workflowProcessIds) ? item.workflowProcessIds : []),
  ...(Array.isArray(item.workflowInstances)
    ? item.workflowInstances.map(instance => instance?.processId)
    : []),
  item.workflowProcessId,
].filter(id => id !== undefined && id !== null && id !== '')));

const isSuccessfulResponse = response => (
  Number(response?.errorCode) === 200 || response?.success === true
);

const normalizeLeadRecord = (item = {}) => {
  const currentBusiness = item.business && typeof item.business === 'object'
    ? item.business
    : {};

  return {
    ...item,
    customerType: item.customerType ?? 'INDIVIDUAL',
    business: {
      companyName: currentBusiness.companyName ?? item.companyName,
      taxCode: currentBusiness.taxCode ?? item.taxCode,
      contactName: currentBusiness.contactName ?? item.contactName,
      jobTitle: currentBusiness.jobTitle ?? item.jobTitle,
      website: currentBusiness.website ?? item.website,
    },
    productIds: Array.isArray(item.productIds)
      ? item.productIds
      : Array.isArray(item.products)
        ? item.products.map(product => product?.id ?? product).filter(Boolean)
        : (item.productId ? [item.productId] : []),
    workflowProcessIds: normalizeWorkflowProcessIds(item),
    birthday: toDatePickerValue(item.birthday),
    inTime: toDatePickerValue(item.inTime ?? item.createdDate ?? item.createdAt) ?? dayjs(),
    lastContactedAt: toDatePickerValue(item.lastContactedAt),
    nextAppointmentAt: toDatePickerValue(item.nextAppointmentAt),
  };
};

const NewLead = ({ closeModal, data }) => {

  const { record: item, listSale } = data;
  const [form] = Form.useForm();
  const [record, setRecord] = useState(() => normalizeLeadRecord(item));
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const currentFormValues = form.getFieldsValue(true);
      const body = {
        ...record,
        ...values,
        ...currentFormValues,
        business: {
          ...(record?.business ?? {}),
          ...(values?.business ?? {}),
          ...(currentFormValues?.business ?? {}),
        },
      };
      delete body.fileUploads;
      delete body.productId;
      delete body.companyName;
      delete body.taxCode;
      delete body.contactName;
      delete body.jobTitle;
      delete body.website;

      if (body.customerType !== 'BUSINESS') {
        body.business = null;
      } else {
        body.business = {
          companyName: body.business?.companyName ?? null,
          taxCode: body.business?.taxCode ?? null,
          contactName: body.business?.contactName ?? null,
          jobTitle: body.business?.jobTitle ?? null,
          website: body.business?.website ?? null,
        };
      }

      const submitBody = {
        ...body,
        fileUrls: (Array.isArray(body.fileUrls) ? body.fileUrls : [])
          .map(resolveUploadFilename)
          .filter(Boolean),
        birthday: formatApiDate(body.birthday),
        inTime: formatApiDate(body.inTime),
        lastContactedAt: formatApiDate(body.lastContactedAt),
        nextAppointmentAt: formatApiDate(body.nextAppointmentAt),
      };

      const selectedWorkflowIds = normalizeWorkflowProcessIds(submitBody);
      const primaryWorkflowId = selectedWorkflowIds[0] ?? null;
      submitBody.workflowProcessIds = selectedWorkflowIds;
      // Giữ contract cũ để BE tiếp tục tự khởi tạo workflow đầu tiên.
      submitBody.workflowProcessId = primaryWorkflowId;
      delete submitBody.workflowInstances;
      delete submitBody.workflowInstance;
      delete submitBody.workflowProcess;

      const payload = normalizeEmptyPayloadValues(submitBody);
      const response = await RequestUtils.Post("/data/create", payload);
      if (isSuccessfulResponse(response)) {
        f5List('data/lists');
        InAppEvent.normalSuccess("Cập nhật thành công");
        InAppEvent.emit(HASH_MODAL_CLOSE);
        return;
      }
      InAppEvent.normalError(response?.message || "Lưu Lead thất bại");
    } catch (error) {
      InAppEvent.normalError(error?.response?.data?.message || error?.message || "Lưu Lead thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RestEditModal
      form={form}
      isMergeRecordOnSubmit={false}
      updateRecord={(values) => {
        setRecord(curvals => ({
          ...curvals,
          ...values,
          business: {
            ...(curvals?.business ?? {}),
            ...(values?.business ?? {}),
          },
        }))
      }}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <LeadForm
        listSale={listSale}
        submitting={submitting}
      />
    </RestEditModal>
  )
}

export default NewLead;
