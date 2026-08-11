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
import { RestEditModal } from '@flast-erp/core/components';

import { RequestUtils, InAppEvent } from '@flast-erp/core/utils';
import { f5List } from '@flast-erp/core/utils';
import { HASH_MODAL_CLOSE } from '@/configs';
import moment from 'moment';
import LeadForm from './LeadForm';
import { resolveUploadFilename } from '@/containers/PreviewModal/uploadUtils';

const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const API_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const formatDisplayDate = (value) => {
  if (!value) return moment().format(DISPLAY_DATE_FORMAT);
  const parsed = moment(value, [DISPLAY_DATE_FORMAT, API_DATE_FORMAT, moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format(DISPLAY_DATE_FORMAT) : value;
};

const formatApiDate = (value) => {
  if (!value) return null;
  const parsed = moment(value, [DISPLAY_DATE_FORMAT, API_DATE_FORMAT, moment.ISO_8601], true);
  return parsed.isValid() ? parsed.format(API_DATE_FORMAT) : value;
};

const normalizeLeadRecord = (item = {}) => ({
  ...item,
  customerType: item.customerType ?? 'INDIVIDUAL',
  productIds: Array.isArray(item.productIds)
    ? item.productIds
    : Array.isArray(item.products)
      ? item.products.map(product => product?.id ?? product).filter(Boolean)
      : (item.productId ? [item.productId] : []),
  inTime: formatDisplayDate(item.inTime ?? item.createdDate ?? item.createdAt),
  lastContactedAt: item.lastContactedAt ? formatDisplayDate(item.lastContactedAt) : undefined,
  nextAppointmentAt: item.nextAppointmentAt ? formatDisplayDate(item.nextAppointmentAt) : undefined,
});

const NewLead = ({ closeModal, data }) => {

  const { record: item, listServices, listSale } = data;
  const [record, setRecord] = useState(() => normalizeLeadRecord(item));
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const body = { ...values };
      delete body.fileUploads;
      delete body.productId;
      const submitBody = {
        ...body,
        fileUrls: (Array.isArray(body.fileUrls) ? body.fileUrls : [])
          .map(resolveUploadFilename)
          .filter(Boolean),
        inTime: formatApiDate(body.inTime),
      };

      const response = await RequestUtils.Post("/data/create", submitBody);
      if (Number(response?.errorCode) === 200 || response?.success === true) {
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
      isMergeRecordOnSubmit={true}
      updateRecord={(values) => {
        setRecord(curvals => ({ ...curvals, ...values }))
      }}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <LeadForm
        listServices={listServices}
        listSale={listSale}
        submitting={submitting}
      />
    </RestEditModal>
  )
}

export default NewLead;
