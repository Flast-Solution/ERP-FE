import { Body, Container, Column, Head, Heading, Html, Preview, Row, Section, Text, } from "@react-email/components";
import { NGHI_PHEP_STATUS_DONE, NGHI_PHEP_STATUS_WAITING } from "configs/constant";
import { formatDateDayjs } from "utils/textUtils";
import HeaderEmail from "./HeaderEmail";
import { arrayNotEmpty } from "utils/dataUtils";
import ESig from "./ESig";

const nRow = {
  marginBottom: "10px",
  paddingLeft: "8px",
  paddingRight: "8px",
  width: "100%",
};

const nRowMarTop50 = {
  ...nRow,
  marginTop: "50px"
}

const main = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  maxWidth: '700px',
  margin: '0 auto'
};

const h2 = {
  color: "#1d1c1d",
  fontSize: "25px",
  fontWeight: "500",
  margin: "30px 0",
  padding: "0",
  lineHeight: "42px",
  textAlign: "center"
};

const pstyle = {
  padding: "0px",
  margin: "0px"
};

const dearAll = {
  padding: "0px",
  paddingTop: "20px",
  margin: "0px"
};

const tBorder = {
  border: '1px solid black',
  borderCollapse: 'collapse',
  padding: '10px 5px'
}

const jobTimeContent = {
  ...tBorder,
  textAlign: 'center'
}

const tTables = {
  ...tBorder,
  width: '100%',
  marginBottom: '30px'
}

const tBorderThJob = {
  ...tBorder,
  width: '60%'
}

export const EOvertime = ({
  management,
  record,
  owrnerInfo
}) => {

  let sigChecked = false, sigConfirm = false;
  if ((record?.status ?? 0) !== 0) {
    const reEditId = record?.overTimeReality?.id ?? -1;
    if (reEditId > -1) {
      sigChecked = record.overTimeReality.status !== NGHI_PHEP_STATUS_WAITING;
      sigConfirm = record.overTimeReality.status === NGHI_PHEP_STATUS_DONE;
    } else {
      sigChecked = record?.status !== NGHI_PHEP_STATUS_WAITING;
      sigConfirm = record?.status === NGHI_PHEP_STATUS_DONE;
    }
  }

  return (
    <Html>
      <Head />
      <Preview>Confirm your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <HeaderEmail />
          <Heading style={h2}>REGISTRATION FOR OVERTIME & WORK ON DAYS OFF</Heading>
          <Row>
            <Column style={{ width: "150px" }}>
              <Text style={pstyle}>Kính gửi / To:</Text>
            </Column>
            <Column>
              <Text style={pstyle}>- Trưởng bộ phận {owrnerInfo?.userBranch?.department ?? ''},  Manager</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "150px" }}>
              <Text style={pstyle}>Thông báo tới/ CC:</Text>
            </Column>
            <Column>
              <Text style={dearAll}>- Bộ phận Hành Chính Nhân Sự/ HR & GA Dept.</Text>
              <Text style={pstyle}>- Tổng giám đốc/ General Director.</Text>
            </Column>
          </Row>
          <Row style={nRowMarTop50}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Tên người đề nghị (Applicant Name):</Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{record?.userCreate ?? owrnerInfo.fullName}</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Bộ phận (Department):</Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{owrnerInfo?.userBranch?.department ?? ''}</Text>
            </Column>
          </Row>

          <Section>
            <Text style={{ fontWeight: 'bold' }}>Thời gian làm thêm (Dates of overtime)</Text>
          </Section>

          <table style={tTables}>
            <tr style={tBorder}>
              <th style={tBorderThJob}>Job description</th>
              <th style={tBorder}>Từ (From)</th>
              <th style={tBorder}>Đến (To)</th>
            </tr>
            {arrayNotEmpty(record?.listRegis?.filter(Boolean)) &&
              <TableRender listRegis={record.listRegis} />
            }
          </table>

          {arrayNotEmpty(record?.otRequestEdit) && (record?.otRequestEdit[0]?.jobs ?? '') !== '' &&
            <Section style={{ marginTop: 30 }}>
              <Text style={{ fontWeight: 'bold' }}>Thời gian điều chỉnh (Dates of overtime edit)</Text>
              <table style={tTables}>
                <tr style={tBorder}>
                  <th style={tBorderThJob}>Job description</th>
                  <th style={tBorder}>Từ (From)</th>
                  <th style={tBorder}>Đến (To)</th>
                </tr>
                <TableRender listRegis={record.otRequestEdit} />
              </table>
            </Section>
          }

          <Section>
            <Text>Kính mong Ban lãnh đạo xem xét và chấp thuận.I kindly request the management to review and approve this request.</Text>
          </Section>

          <ESig
            management={management}
            record={record}
            owrnerInfo={owrnerInfo}
            sigChecked={sigChecked}
            sigConfirm={sigConfirm}
          />
        </Container>
      </Body>
    </Html>
  )
};

const TableRender = ({ listRegis }) => {
  const safeList = (listRegis || []).filter(Boolean);
  return safeList.map((item, idx) => (
    <tr key={idx} style={tBorder}>
      <td style={tBorder}>{item?.jobs ?? ''}</td>
      <td style={jobTimeContent}>{formatDateDayjs(item?.startTime, "MM-DD HH:mm")}</td>
      <td style={jobTimeContent}>{formatDateDayjs(item?.endTime, "MM-DD HH:mm")}</td>
    </tr>
  ));
}

export default EOvertime;
