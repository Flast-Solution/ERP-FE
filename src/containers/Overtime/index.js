import React, { useCallback, useEffect, useState } from 'react';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';
import OverTimeForm from './OverTimeForm';
import { arrayNotEmpty, dateFormatOnSubmit, f5List } from 'utils/dataUtils';
import OVReview from './OVReview';
import { Form, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { NGHI_PHEP_STATUS_WAITING } from 'configs/constant';
import { useStore } from "DataContext";
import useGetMe from 'hooks/useGetMe';
import RegisForm from './RegisForm';
import FormListAddition from 'components/form/FormListAddtion';
import CustomButton from 'components/CustomButton';
import { cloneDeep } from "lodash";

const OverTime = ({ closeModal, data }) => {

  const { user } = useStore();
  const { isUser } = useGetMe()
  const [ record, setRecord ] = useState({});

  useEffect(() => {
    let dataClone = cloneDeep(data)
    if(data?.overTimeReality?.listRegis) {
      dataClone.otRequestEdit = data.overTimeReality.listRegis;
    }
    setRecord(dataClone);
  }, [data]);
  
  const onSubmit = useCallback( async (values) => {
    let params = (values?.id ?? '') === '' ? {} : { id: values.id };
    let uri = params?.id ? 'update' : 'create';
    let nUri = String("/over-time/").concat(uri);
    const { errorCode } = await RequestUtils.Post(nUri, values, params);
    f5List('over-time/fetch');
    InAppEvent.normalInfo(errorCode === 200 ? "Cập nhật thành công" : "Lỗi cập nhật, vui lòng thử lại sau");
  }, []);

  const formatOnSubmit = useCallback((data) => {
    let values = cloneDeep(data);
    dateFormatOnSubmit(values, ['createdAt']);
    if(arrayNotEmpty(values?.listRegis)) {
      for(let regis of values.listRegis) {
        dateFormatOnSubmit(regis, ['startTime', 'endTime']);
      }
    }
    let overTimeReality = {
      listRegis: [],
      status: 0
    };
    if(arrayNotEmpty(values?.otRequestEdit)) {
      for(let regis of values.otRequestEdit) {
        dateFormatOnSubmit(regis, ['startTime', 'endTime']);
      }
      overTimeReality.listRegis = values.otRequestEdit;
    }
    let domContent = document.getElementById("np-content-html");
    if(domContent) {
      values.contentEmail = domContent.innerHTML;
    }
    values.overTimeReality = overTimeReality;
    values.userId = user.id;
    return values;
  }, [user]);

  const showReSubmit = (data?.status || 0 ) > NGHI_PHEP_STATUS_WAITING && isUser();
  const goodShowPreview = useCallback( (values) => {
    if( (data?.status || 0 ) > NGHI_PHEP_STATUS_WAITING || showReSubmit) {
      return true;
    }
    return (values?.preview ?? false) === true;
  }, [data, showReSubmit]);

  return <>
    <RestEditModal
      isMergeOnSubmit={false}
      formatOnSubmit={formatOnSubmit}
      updateRecord={(values) => setRecord(curvals => ({...curvals, ...values}))}
      onSubmit={onSubmit}
      record={record}
      closeModal={closeModal}
    >
      <Form.Item
        noStyle
        shouldUpdate={
          (prevValues, curValues) => prevValues.startedAt !== curValues.startedAt 
          || prevValues.endAt !== curValues.endAt 
          || prevValues.preview !== curValues.preview 
          || prevValues.type !== curValues.type 
          || prevValues.listRegis !== curValues.listRegis
          || prevValues.otRequestEdit !== curValues.otRequestEdit
        }
      >
        {({ getFieldValue }) => {
          const show = goodShowPreview(getFieldValue());
          return <OVReview show={show} record={getFieldValue()} />
        }}
      </Form.Item>
      { (data?.status || 0 ) > NGHI_PHEP_STATUS_WAITING ? "" : <OverTimeForm /> }
      { showReSubmit && 
        <div style={{marginTop: 30}}>
          <Typography.Title level={5}>
            <FormOutlined />
            <span style={{marginLeft: 20}}>Điều chỉnh làm thêm giờ thực tế (Overtime Edit)</span>
          </Typography.Title>
          <FormListAddition name="otRequestEdit">
            <RegisForm />
          </FormListAddition>
          <div style={{display: 'flex', justifyContent:'end'}}>
            <CustomButton  htmlType="submit" title="Gửi đề xuất" color="danger"  variant="solid" />
          </div>
        </div>
      }
    </RestEditModal>
  </>
}

export default OverTime;