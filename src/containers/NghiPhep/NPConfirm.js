import React, { useCallback, useContext, useMemo, useState } from 'react';

import {
  RestEditModal,
  FormContextCustom, 
  CustomButton,
  FormTextArea
} from '@flast-erp/core/components';

import { InAppEvent, f5List, RequestUtils } from '@flast-erp/core/utils';
import NPReview from './NPReview';
import useGetMe from '@/hooks/useGetMe';
import { Popconfirm } from 'antd';
import {
  NGHI_PHEP_STATUS_DONE,
  NGHI_PHEP_STATUS_REJECT,
  NGHI_PHEP_STATUS_WAITING
} from '@/configs/constant';

const applyStyleDaKy = (element, text) => {
  let daKy = document.getElementById(element);
  if (daKy) {
    daKy.innerHTML = text;
    let styleDaKy = daKy.style;
    styleDaKy.color = "blue";
    styleDaKy.margin = "0 auto";
    styleDaKy.marginBottom = "15px";
    styleDaKy.lineHeight = "10px";
    styleDaKy.fontSize = "14px";
    styleDaKy.padding = "8px";
    styleDaKy.borderRadius = "3px";
    styleDaKy.border = "1px solid #46819d";
    styleDaKy.width = "100px";
    styleDaKy.textAlign = "center";
  }
}

const BtnCancel = ({
  data,
  showNoteCancel,
  setShowNote
}) => {

  const { isLeader, isManager } = useGetMe();
  const { form } = useContext(FormContextCustom);

  const onSubmitCancel = useCallback(() => {
    form.validateFields().then((values) => {
      let nItem = {};
      nItem.noteCheck = values.note;
      applyStyleDaKy("daKiemTra", "Không duyệt");
      nItem.status = NGHI_PHEP_STATUS_REJECT;
      const uri = "/leave-of-absence/check-leave-of";
      RequestUtils.Post(uri, { ...data, ...nItem }).then(({ message }) => {
        InAppEvent.normalInfo(message);
      });
      f5List('leave-of-absence/fetch');
    });
    /* eslint-disable-next-line  */
  }, [data, form]);

  const canApprove = isLeader() || isManager();
  if (canApprove) {
    return data.status === NGHI_PHEP_STATUS_WAITING ? (
      <CustomButton
        onClick={() => {
          if (!showNoteCancel) {
            setShowNote(pre => !pre)
          } else {
            onSubmitCancel();
          }
        }}
        title={showNoteCancel ? 'Không duyệt' : 'Không duyệt'}
        type='primary'
      />
    ) : <span />
  } else {
    return <span />
  }
}

const NPConfirm = ({ closeModal, data }) => {

  const { isLeader, isManager } = useGetMe();
  const [showNoteCancel, setShowNote] = useState(false);

  const onSubmitConfirm = useCallback(() => {
    let nItem = {};
    nItem.status = NGHI_PHEP_STATUS_DONE;
    applyStyleDaKy("daKiemTra", "Đã duyệt");
    const uri = "/leave-of-absence/check-leave-of";
    RequestUtils.Post(uri, { ...data, ...nItem }).then(({ message }) => {
      InAppEvent.normalInfo(message);
    });
    f5List('leave-of-absence/fetch');
    closeModal()
    /* eslint-disable-next-line  */
  }, [data]);

  const canApprove = isLeader() || isManager();
  const btnConfirm = useMemo(() => {
    if (canApprove) {
      return (data.status === NGHI_PHEP_STATUS_WAITING && !showNoteCancel) ? (
        <Popconfirm
          title="Duyệt đơn"
          description="Bạn có chắc chắn duyệt đơn này?"
          onConfirm={onSubmitConfirm}
          okText="Có"
          cancelText="Không"
        >
          <CustomButton
            htmlType="submit"
            title="Duyệt"
            color="danger"
            style={{ marginLeft: 20 }}
            variant="solid"
          />
        </Popconfirm>
      ) : <span />
    }
    /* eslint-disable-next-line  */
  }, [showNoteCancel, data, canApprove]);

  return <>
    <RestEditModal
      isMergeOnSubmit={false}
      record={data}
      closeModal={closeModal}
    >
      <NPReview show={true} record={data} />
      {showNoteCancel &&
        <FormTextArea
          name="note"
          rows={4}
          required
          label={"Lý do huỷ"}
          placeholder={"Nhập lý do huỷ"}
        />
      }
      <div style={{ display: 'flex', justifyContent: 'end', margin: '30px 30px', alignItems: 'center' }}>
        <BtnCancel
          data={data}
          showNoteCancel={showNoteCancel}
          setShowNote={setShowNote}
        />
        {btnConfirm}
      </div>
    </RestEditModal>
  </>
}

export default NPConfirm;