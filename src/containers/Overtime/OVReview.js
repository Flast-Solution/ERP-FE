import { render } from '@react-email/render';
import { useEffect, useState } from 'react';
import EOvertime from 'containers/Email/EOvertime';
import { useStore } from "DataContext";
import RequestUtils from 'utils/RequestUtils';
import { SUCCESS_API_CODE } from 'configs/constant';

const OVReview = ({
  record,
  show = false
}) => {

  const [ html, setHtml ] = useState('');
  const { user } = useStore();
  const [ management, setManagement] = useState({});
  
  useEffect(() => {
    RequestUtils.Get("/user/fetch-level-manager", { idUser: user.id}).then( ({ data, errorCode }) => {
      if(errorCode === SUCCESS_API_CODE ) {
        setManagement(data);
      }
    })
  }, [user]);

  useEffect(() => {
    (async () => {
      let owrnerInfo = user;
      if(record?.userId && owrnerInfo?.id !== record?.userId) {
        const { data: dOwrner, errorCode: code } = await RequestUtils.Get("/user/list", { ids: record.userId});
        if(code === SUCCESS_API_CODE && dOwrner.find(i => i.id === record.userId)) {
          owrnerInfo = dOwrner.find(i => i.id === record.userId)
        }
      }
      const html = await render(
        <EOvertime owrnerInfo={owrnerInfo} management={management} record={record} />, { pretty: true }
      );
      setHtml(html);
    })();
  }, [record, user, management]);
  return <div id="np-content-html" style={{display: show ? 'block': 'none'}} dangerouslySetInnerHTML={{__html: html}} />;
}

export default OVReview;