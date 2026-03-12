import React from 'react';
import { Column, Row, Section, Text, } from "@react-email/components";
import { APP_FOLLOW_STATUS_REJECT } from "configs/constant";
import { formatDate } from "utils/textUtils";

const nRow = {
  marginBottom: "10px",
  paddingLeft: "8px",
  paddingRight: "8px",
  width: "100%",
};

const pstyle = {
  padding: "0px",
  margin: "0px"
};

const signText = {
  fontSize: "17px",
  padding: "0px",
  margin: "0px",
  fontWeight: "bold",
  textAlign: "center"
};

const styleDaKy = {
  color: "blue",
  margin: "0 auto",
  marginBottom: "15px",
  lineHeight: "10px",
  fontSize: "14px",
  padding: "8px",
  borderRadius: "3px",
  border: "1px solid #46819d",
  width: "100px",
  textAlign: "center"
};

const styleChuaKy = {
  ...styleDaKy,
  border: 'none',
  marginBottom: "30px"
}

const ESig = ({
  management,
  record,
  owrnerInfo,
  sigChecked,
  sigConfirm
}) => {

  return (
    <Row style={nRow}>
      <Column style={{ width: "33%", textAlign: "center" }}>
        <Text style={signText}>Người đề nghị  <br /> (Requestor)</Text>
        <Text style={pstyle}>{owrnerInfo?.fullName ?? ''}</Text>
        <Section style={{ height: 20, width: '100%' }} />
        <Text style={styleDaKy}>Đã Ký</Text>
        <Text style={pstyle}>({formatDate(record?.createdAt)})</Text>
      </Column>
      <Column style={{ width: "33%", textAlign: "center" }}>
        <Text style={signText}>Người kiểm tra  <br /> (Checked by)</Text>
        <Text style={pstyle}>{management?.leader?.fullName ?? record?.userCheck}</Text>
        <Section style={{ height: 20, width: '100%' }} />
        <Text id="daKiemTra" style={sigChecked ? styleDaKy : styleChuaKy}>
          {sigChecked ? 'Đã kiểm tra' : ''}
        </Text>
        <Text style={pstyle}>({formatDate(record?.createdAt)})</Text>
      </Column>
      <Column style={{ width: "33%", textAlign: "center" }}>
        <Text style={signText}>Người phê duyệt  <br /> (Appoved by)</Text>
        <Text style={pstyle}>{management?.manager?.fullName ?? record?.userAppoved}</Text>
        <Section style={{ height: 20, width: '100%' }} />
        <Text id="daKy" style={(sigConfirm || record?.status === APP_FOLLOW_STATUS_REJECT) ? styleDaKy : styleChuaKy}>
          {record?.status === APP_FOLLOW_STATUS_REJECT ? 'Cancel' : (sigConfirm ? 'Đã Ký' : '')}
        </Text>
        <Text style={pstyle}>({formatDate(record?.createdAt)})</Text>
      </Column>
    </Row>
  )
};

export default ESig;
