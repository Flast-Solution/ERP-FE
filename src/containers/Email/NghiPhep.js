import { Body, Container, Column, Head, Heading, Html, Preview, Row, Section, Text, } from "@react-email/components";
import { NGHI_PHEP_META, NGHI_PHEP_STATUS_DONE, NGHI_PHEP_STATUS_WAITING } from "configs/constant";
import { formatDateDayjs } from "utils/textUtils";
import HeaderEmail from "./HeaderEmail";
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

export const XinNghiPhep = ({
  management,
  record,
  owrnerInfo
}) => {

  let sigChecked = false, sigConfirm = false;
  if ((record?.status ?? 0) !== 0) {
    sigChecked = record?.status !== NGHI_PHEP_STATUS_WAITING;
    sigConfirm = record?.status === NGHI_PHEP_STATUS_DONE;
  }

  return (
    <Html>
      <Head />
      <Preview>Confirm your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <HeaderEmail />
          <Heading style={h2}>ĐƠN XIN NGHỈ PHÉP (LEAVE OF ABSENCE FORM)</Heading>
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
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Lý do xin nghỉ (Purpose for Leave):</Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text>{record?.note ?? '(Unknow)'}</Text>
            </Column>
          </Row>

          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Thời gian nghỉ (Dates of Leave):</Text>
            </Column>
            <Column>
              <Text style={pstyle}>Từ ngày (From): {formatDateDayjs(record?.startedAt, "DD-MM")}, đến ngày (To) {formatDateDayjs(record?.endAt, "DD-MM")}</Text>
            </Column>
          </Row>

          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Số ngày nghỉ (Number of Days):</Text>
            </Column>
            <Column>
              <Text style={pstyle}>{record?.numberOff ?? 1} ngày</Text>
            </Column>
          </Row>

          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Hình thức nghỉ (Type of Leave):</Text>
            </Column>
            <Column>
              <Text style={pstyle}>{NGHI_PHEP_META.find(i => i.id === (record?.type ?? 0))?.name ?? '(Unknow)'}</Text>
            </Column>
          </Row>

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

export default XinNghiPhep;
