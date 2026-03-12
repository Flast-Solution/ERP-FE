import { render } from '@react-email/render';
import { useCallback, useEffect, useState } from 'react';
import NghiPhep from 'containers/Email/NghiPhep';
import { useStore } from "DataContext";
import RequestUtils from 'utils/RequestUtils';
import { APP_FOLLOW_STATUS_DONE, SUCCESS_API_CODE } from 'configs/constant';
import useGetMe from 'hooks/useGetMe';
import { Button } from 'antd';
import { f5List } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';

const NPReview = ({
  record,
  show = false
}) => {

  const [ html, setHtml ] = useState('');
  const { user } = useStore();
  const [ management, setManagement ] = useState({});

  const { isLeader } = useGetMe();
  useEffect(() => {
    RequestUtils.Get("/user/fetch-level-manager", { idUser: user.id }).then(({ data, errorCode }) => {
      if (errorCode === SUCCESS_API_CODE) {
        setManagement(data);
      }
    })
  }, [user]);

  const cancelAbsence = useCallback(async () => {
    let params = record;
    params.status = 3;
    let uri = 'update';
    let nUri = String("/leave-of-absence/").concat(uri);
    const { errorCode } = await RequestUtils.Post(nUri, params);
    f5List('leave-of-absence/fetch');
    InAppEvent.normalInfo(errorCode === 200 ? "Cập nhật thành công" : "Lỗi cập nhật, vui lòng thử lại sau");
  }, [record]);

  useEffect(() => {
    (async () => {
      let owrnerInfo = user;
      if (record?.userId && owrnerInfo?.id !== record?.userId) {
        const { data: dOwrner, errorCode: code } = await RequestUtils.Get("/user/list", { ids: record.userId });
        if (code === SUCCESS_API_CODE && dOwrner.find(i => i.id === record.userId)) {
          owrnerInfo = dOwrner.find(i => i.id === record.userId)
        }
      }
      const html = await render(
        <NghiPhep owrnerInfo={owrnerInfo} management={management} record={record} />, { pretty: true }
      );
      setHtml(html);
    })();
  }, [record, user, management]);

  return <div>
    <div 
      id="np-content-html" 
      style={{ display: show ? 'block' : 'none' }} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
    { isLeader && record.status === APP_FOLLOW_STATUS_DONE &&
      <div style={{ display: 'flex', justifyContent: 'end', marginTop: 15 }}>
        <Button
          onClick={() => cancelAbsence()}
          type='primary'
          htmlType="submit"
          danger
        >
          Hủy lịch
        </Button>
      </div>
    }
  </div>
}

export default NPReview;