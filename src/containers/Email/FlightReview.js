import React from 'react';
import { Body, Container, Column, Head, Heading, Html, Preview, Row, Section, Text, } from "@react-email/components";
import { APP_FOLLOW_STATUS_DONE, APP_FOLLOW_STATUS_WAITING } from "configs/constant";
import HeaderEmail from "./HeaderEmail";
import ESig from "./ESig";
import { formatDateDayjs } from "utils/textUtils";
import { arrayNotEmpty, formatMoney } from "utils/dataUtils";
import UserService from "services/UserService";
import { FLIGHT_WAY_TYPE } from "configs/localData";

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

export const FlightReview = ({
  management,
  record,
  owrnerInfo
}) => {

  let sigChecked = false, sigConfirm = false;
  if ((record?.status ?? 0) !== 0) {
    sigChecked = record?.status !== APP_FOLLOW_STATUS_WAITING;
    sigConfirm = record?.status === APP_FOLLOW_STATUS_DONE;
  }

  return (
    <Html>
      <Head />
      <Preview>Confirm your email address</Preview>
      <Body style={main}>
        <Container style={container}>
          <HeaderEmail />
          <Heading style={h2}>ĐẶT VÉ MÁY BAY ĐI CÔNG TÁC <br /> REGISTRATION FOR FLIGHT TICKET FOR BUSINESS TRIP</Heading>

          <Row style={nRowMarTop50}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>Tên người đề nghị (Applicant Name):</Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>
                <span>{record?.userCreate ?? owrnerInfo.fullName}</span>
                <span style={{ marginLeft: 30 }}>(Ngày {formatDateDayjs(record.createdAt)})</span>
              </Text>
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
            <Text style={pstyle}>Mục đích công tác / Purpose : {record.note}</Text>
          </Section>

          <Section>
            <Text style={{ fontWeight: 'bold' }}>Thông tin chuyến bay / Flight information</Text>
          </Section>
          <TableItem
            scheduleBusList={record?.scheduleBusList ?? []}
          />

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

const TableItem = ({ scheduleBusList }) => {
  return <>
    <table style={{ width: "100%", border: "1px solid #ddd", borderCollapse: "collapse", padding: 10 }}>
      <tbody>
        <tr style={{ borderBottom: "1px solid #ddd", background: "#3dbeb3", color: "#fff" }} >
          <th style={{ padding: 10, textAlign: "center" }}>STT</th>
          <th style={{ padding: 10, textAlign: "center" }}>Nội dung</th>
          <th style={{ padding: 10, textAlign: "center" }}>Chi phí</th>
        </tr>
        {scheduleBusList?.filter(Boolean).map((item, id) => (
          <React.Fragment key={id}>
            <tr style={{ borderBottom: "1px solid #cccccc8c" }}>
              <td
                rowSpan={2}
                style={{ borderRight: "1px solid #ccc", padding: 10, textAlign: "center" }}
              >
                {id + 1}
              </td>
              <td style={{ padding: 10, textAlign: "left" }}>
                <b>Chiều / Flight Way: {FLIGHT_WAY_TYPE.find(i => i.value === item?.type)?.text ?? '(Unset)'}</b>
              </td>
              <td style={{ padding: 10, textAlign: "center" }}></td>
            </tr>
            <tr style={{ borderBottom: "1px solid #cccccc8c" }}>
              <td style={{ padding: 10, textAlign: "left", width: '70%' }}>
                <p>- Từ / From: {item?.from ?? ''}</p>
                <p>- Đến / To: {item?.to ?? ''}</p>
                <p>- Chuyến bay / Flight no: {item?.flightNo ?? '(empty)'}</p>
                <p>- Hạng vé / Grade of ticket: {item?.gradeOfTicket ?? ''}</p>
                <p>- Ngày, giờ khởi hành/ Departure time: {formatDateDayjs(item?.departureTime, "DD-MM-YYYY HH:mm")}</p>
                <p>- Ngày, giờ tới nơi/ Arrival time: {formatDateDayjs(item?.arrivalTime, "DD-MM-YYYY HH:mm")}</p>
                {arrayNotEmpty(item?.userId) &&
                  <p>- Nhân viên/ Employe:
                    {' '}
                    {item?.userId?.map((id) => UserService.fetchNameById(id)).join(", ")}
                  </p>
                }
              </td>
              <td style={{ textAlign: "center" }}>
                <p>{formatMoney(item?.estimatePrice)}</p>
              </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
    <table style={{ width: "100%" }}>
      <tbody>
        <tr>
          <td valign="top" width="100%" style={{ padding: "16px 0" }}>
            <table border={0} width="100%" style={{ textAlign: "right" }}>
              <tbody>
                <tr id="vorh">
                  <td align="right" width="70%" style={{ padding: "12px 12px 0" }}>
                    <b>Tổng thanh toán / Total Paid:</b>
                  </td>
                  <td className="total" width="30%" style={{ padding: "12px 12px 0" }} >
                    <p style={{ fontSize: 16, fontWeight: 700, ...pstyle }}>
                      {formatMoney(scheduleBusList?.filter(Boolean).map(item => item?.estimatePrice || 0).reduce((sum, num) => sum + num, 0))}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </>
}

export default FlightReview;