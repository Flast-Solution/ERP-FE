import React, { useEffect, useCallback, useContext, useMemo, useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { InAppEvent } from 'utils/FuseUtils';
import { f5List } from 'utils/dataUtils';
import OVReview from './OVReview';
import useGetMe from 'hooks/useGetMe';
import CustomButton from 'components/CustomButton';
import { Popconfirm } from 'antd';
import { 
  NGHI_PHEP_STATUS_CONFIRM,
  NGHI_PHEP_STATUS_DONE, 
  NGHI_PHEP_STATUS_REJECT, 
  NGHI_PHEP_STATUS_WAITING
} from 'configs/constant';
import FormTextArea from 'components/form/FormTextArea';
import RequestUtils from 'utils/RequestUtils';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { cloneDeep } from 'lodash';

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
      if(isLeader()) {
        nItem.noteCheck = values.note;
        applyStyleDaKy("daKiemTra", "Cancel");
      }
      if(isManager()) {
        nItem.noteAppoved = values.note;
        applyStyleDaKy("daKy", "Cancel");
      }
      nItem.status = NGHI_PHEP_STATUS_REJECT;
      const uri = isLeader() ? "/over-time/check-leave-of" : "/over-time/appoved-leave-of";
      RequestUtils.Post(uri, {...data, ...nItem }).then(({ message }) => {
        InAppEvent.normalInfo(message);
      });
      f5List('over-time/fetch');
    });
    /* eslint-disable-next-line  */
  }, [data, form]);

  const reEditStatus = data?.overTimeReality?.status ?? -1;
  const status = data.status;

  if(isLeader()) {
    return (status === NGHI_PHEP_STATUS_WAITING || reEditStatus === NGHI_PHEP_STATUS_WAITING) ? (
      <CustomButton 
        onClick={() => {
          if(!showNoteCancel) {
            setShowNote(pre => !pre)
          } else {
            onSubmitCancel();
          }
        }}
        title={showNoteCancel ? 'Canceling' : 'Cancel'} 
        type='primary'
      />
    ) : <span />
  } else if(isManager()) {
    if(status === NGHI_PHEP_STATUS_DONE || reEditStatus === NGHI_PHEP_STATUS_DONE) {
      return <span />
    }
    return (status !== NGHI_PHEP_STATUS_REJECT || reEditStatus !== NGHI_PHEP_STATUS_REJECT) ? (
      <CustomButton 
        onClick={() => {
          if(!showNoteCancel) {
            setShowNote(pre => !pre)
          } else {
            onSubmitCancel();
          }
        }}
        title={showNoteCancel ? 'Canceling' : 'Cancel'} 
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

  const { isLeader, isManager } = useGetMe();
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
    if(isLeader()) {
      nItem.status = NGHI_PHEP_STATUS_CONFIRM;
      if(reEditStatus) {
        values.overTimeReality.status = NGHI_PHEP_STATUS_CONFIRM;
      }
      applyStyleDaKy("daKiemTra", "Đã kiểm tra");
    }
    if(isManager()) {
      nItem.status = NGHI_PHEP_STATUS_DONE;
      if(reEditStatus) {
        values.overTimeReality.status = NGHI_PHEP_STATUS_DONE;
      }
      applyStyleDaKy("daKy", "Đã Ký");
    }
    // let domContent = document.getElementById("np-content-html");
    // if(domContent) {
    //   nItem.contentEmail = domContent.innerHTML;
    // }
    const uri = isLeader() ? "/over-time/check-leave-of" : "/over-time/appoved-leave-of";
    RequestUtils.Post(uri, {...values, ...nItem }).then(({ message }) => {
      InAppEvent.normalInfo(message);
    });
    f5List('over-time/fetch');
    /* eslint-disable-next-line  */
  }, [record]);

  const btnConfirm = useMemo(() => {
    const reEditStatus = record?.overTimeReality?.status ?? -1;
    const status = record.status;
    if(isLeader()) {
      return ( 
        (status === NGHI_PHEP_STATUS_WAITING || reEditStatus === NGHI_PHEP_STATUS_WAITING) && !showNoteCancel) ? (
        <Popconfirm
          title="Confirm Item"
          description="Are you sure this confirm ?"
          onConfirm={onSubmitConfirm}
          okText="Yes"
          cancelText="No"
        >
          <CustomButton 
            htmlType="submit"
            title="Confirm" 
            color="danger" 
            style={{marginLeft: 20}}
            variant="solid"
          />
        </Popconfirm>
      ) : <span />
    } else if(isManager()) {
      return ( 
        (status === NGHI_PHEP_STATUS_CONFIRM || reEditStatus === NGHI_PHEP_STATUS_CONFIRM ) && !showNoteCancel ) ? (
        <Popconfirm
          title="Confirm Item"
          description="Are you sure this confirm ?"
          onConfirm={onSubmitConfirm}
          okText="Yes"
          cancelText="No"
        >
          <CustomButton 
            htmlType="submit"
            title="Confirm" 
            color="danger" 
            style={{marginLeft: 20}}
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