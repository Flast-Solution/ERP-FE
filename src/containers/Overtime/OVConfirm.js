import React, { useEffect, useCallback, useContext, useMemo, useState } from 'react';
import RestEditModal from '@flast-erp/core/components/RestLayout/RestEditModal';
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils';
import { f5List } from '@flast-erp/core/utils/dataUtils';
import OVReview from './OVReview';
import useGetMe from '@flast-erp/core/hooks/useGetMe';
import CustomButton from '@flast-erp/core/components/CustomButton';
import { Popconfirm } from 'antd';
import { 
  NGHI_PHEP_STATUS_DONE, 
  NGHI_PHEP_STATUS_REJECT, 
  NGHI_PHEP_STATUS_WAITING
} from '@/configs/constant';
import FormTextArea from '@/form-flast/FormTextArea';
import RequestUtils from '@flast-erp/core/utils/RequestUtils';
import { FormContextCustom } from '@flast-erp/core/components/context/FormContextCustom';
import { cloneDeep } from 'lodash';

const BtnCancel = ({
  data,
  showNoteCancel,
  setShowNote
}) => {

  const { isLeader } = useGetMe();
  const { form } = useContext(FormContextCustom);

  const onSubmitCancel = useCallback(() => {
    form.validateFields().then((values) => {
      let nItem = {};
      nItem.noteCheck = values.note;
      applyStyleDaKy("daKiemTra", "Không duyệt");
      nItem.status = NGHI_PHEP_STATUS_REJECT;
      const reEditStatus = data?.overTimeReality ?? false;
      if (reEditStatus) {
        nItem.overTimeReality = { ...reEditStatus, status: NGHI_PHEP_STATUS_REJECT };
      }
      const uri = "/over-time/check-leave-of";
      RequestUtils.Post(uri, { ...data, ...nItem }).then(({ message }) => {
        InAppEvent.normalInfo(message);
      });
      f5List('over-time/fetch');
    });
    /* eslint-disable-next-line  */
  }, [data, form]);

  const reEditStatus = data?.overTimeReality?.status ?? -1;
  const status = data.status;

  if (isLeader()) {
    return (status === NGHI_PHEP_STATUS_WAITING || reEditStatus === NGHI_PHEP_STATUS_WAITING) ? (
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

const applyStyleDaKy = (element, text) => {
  let daKy = document.getElementById(element);
  if(daKy) {
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

const NPConfirm = ({ closeModal, data }) => {

  const { isLeader } = useGetMe();
  const [ showNoteCancel, setShowNote ] = useState(false);
  const [ record, setRecord ] = useState({});

  useEffect(() => {
    let dataClone = cloneDeep(data)
    if(data?.overTimeReality?.listRegis) {
      dataClone.otRequestEdit = data.overTimeReality.listRegis;
    }
    setRecord(dataClone);
  }, [data]);

  const onSubmitConfirm = useCallback(async () => {
    let values = cloneDeep(record)
    let nItem = {};
    const reEditStatus = values?.overTimeReality ?? false;
    nItem.status = NGHI_PHEP_STATUS_DONE;
    if (reEditStatus) {
      values.overTimeReality.status = NGHI_PHEP_STATUS_DONE;
    }
    applyStyleDaKy("daKiemTra", "Đã duyệt");
    const uri = "/over-time/check-leave-of";
    RequestUtils.Post(uri, { ...values, ...nItem }).then(({ message }) => {
      InAppEvent.normalInfo(message);
    });
    f5List('over-time/fetch');
    closeModal()
    /* eslint-disable-next-line  */
  }, [record]);

  const btnConfirm = useMemo(() => {
    const reEditStatus = record?.overTimeReality?.status ?? -1;
    const status = record.status;
    if (isLeader()) {
      return (
        (status === NGHI_PHEP_STATUS_WAITING || reEditStatus === NGHI_PHEP_STATUS_WAITING) && !showNoteCancel) ? (
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
  }, [showNoteCancel, record]);

  return <>
    <RestEditModal
      isMergeOnSubmit={false}
      record={record}
      closeModal={closeModal}
    >
      <OVReview show={true} record={record} />
      { showNoteCancel &&
        <FormTextArea 
          name="note"
          rows={4}
          required
          label={"Lý do huỷ"}
          placeholder={"Nhập lý do huỷ"}
        />
      }
      <div style={{display: 'flex', justifyContent:'end', margin: '30px 30px', alignItems: 'center'}}>
        <BtnCancel 
          data={record}
          showNoteCancel={showNoteCancel}
          setShowNote={setShowNote}
        />
        { btnConfirm }
      </div>
    </RestEditModal>
  </>
}

export default NPConfirm;