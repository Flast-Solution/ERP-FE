import React from 'react';
import { Body, Container, Column, Head, Heading, Html, Preview, Row, Section, Text, } from "@react-email/components";
import { APP_FOLLOW_STATUS_DONE, APP_FOLLOW_STATUS_WAITING } from "configs/constant";
import HeaderEmail from "./HeaderEmail";
import ESig from "./ESig";
import { formatDateDayjs } from "utils/textUtils";
import { HOTEL_ROOM_PAY_TYPE } from "configs/localData";
import { arrayNotEmpty, formatMoney } from "utils/dataUtils";
import UserService from "services/UserService";

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

export const HotelReview = ({
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
          <Heading style={h2}>ĐẶT PHÒNG KHÁCH SẠN <br /> REGISTRATION FOR HOTEL</Heading>

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
            <Text style={{ fontWeight: 'bold' }}>Thông tin khách sạn / Hotel's  information</Text>
          </Section>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>- Tên khách sạn  / Hotel name: </Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{record.nameHotel}</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>- Địa chỉ / Address: </Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{record.address}</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>- Liên hệ / Contact: </Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{record.contract}</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>- Số lượng phòng / Room No: </Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{record.roomNo}</Text>
            </Column>
          </Row>
          <Row style={nRow}>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>- Thanh toán / Payment: </Text>
            </Column>
            <Column style={{ width: "50%" }}>
              <Text style={pstyle}>{HOTEL_ROOM_PAY_TYPE.find(i => i.value === record.payment)?.text ?? ''}</Text>
            </Column>
          </Row>

          <Section>
            <Text style={{ fontWeight: 'bold' }}>Danh sách đăng kí đặt khách sạn / Booking list</Text>
          </Section>
          <TableItem
            bookingList={record?.bookingList ?? []}
          />

          <Section>
            <Text><strong>Ghi chú / Note: Địa chỉ suất hóa đơn</strong></Text>
            <span>* CÔNG TY TNHH UNITIKA TRADING VIỆT NAM <br /></span>
            <span>* Mã số thuế:     0106298072 <br /></span>
            <span>* Địa chỉ: Ô số 1, Tầng 6, Toà Indochina Plaza, Số 241 Xuân Thủy, Quận Cầu Giấy, TP Hà Nội. <br /></span>
            <span>* Email nhận hóa đơn: nga.gtt@unitika.com.vn</span>
          </Section>

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

const TableItem = ({ bookingList }) => {
  return <>
    <table style={{ width: "100%", border: "1px solid #ddd", borderCollapse: "collapse", padding: 10 }}>
      <tbody>
        <tr style={{ borderBottom: "1px solid #ddd", background: "#3dbeb3", color: "#fff" }} >
          <th style={{ padding: 10, textAlign: "center" }}>STT</th>
          <th style={{ padding: 10, textAlign: "center" }}>Nội dung</th>
          <th style={{ padding: 10, textAlign: "center" }}>Chi phí</th>
        </tr>
        {bookingList?.filter(Boolean).map((item, id) => (
          <React.Fragment key={id}>
            <tr style={{ borderBottom: "1px solid #cccccc8c" }}>
              <td
                rowSpan={2}
                style={{ borderRight: "1px solid #ccc", padding: 10, textAlign: "center" }}
              >
                {id + 1}
              </td>
              <td style={{ padding: 10, textAlign: "left" }}>
                <b>
                  Checkin: {item?.checkIn ? formatDateDayjs(item?.checkIn, "DD-MM-YYYY HH:mm") : ""}
                  {" - "}
                  CheckOut: {item?.checkOut ? formatDateDayjs(item?.checkOut, "DD-MM-YYYY HH:mm") : ""}
                </b>
              </td>
              <td style={{ padding: 10, textAlign: "center" }}></td>
            </tr>
            <tr style={{ borderBottom: "1px solid #cccccc8c" }}>
              <td style={{ padding: 10, textAlign: "left", width: '70%' }}>
                <p>- Số đêm nghỉ / nights: {item?.nights}</p>
                <p>- Loại phòng/ Room type: {item?.typeRoom}</p>
                <p>- Yêu cầu đặc biệt/ Special request: <br /> {item?.specialRequest ?? '(empty)'}</p>
                {arrayNotEmpty(item?.userId) &&
                  <p>- Nhân viên/ Employe:
                    {' '}
                    {item?.userId?.map((id) => UserService.fetchNameById(id)).join(", ")}
                  </p>
                }
              </td>
              <td style={{ textAlign: "center" }}>
                <p>{formatMoney(item?.estimatePrice || 0)}</p>
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
                      {formatMoney(
                        bookingList
                          ?.filter(Boolean)
                          ?.map(item => item.estimatePrice || 0)
                          ?.reduce((sum, num) => sum + num, 0)
                      )}
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

export default HotelReview;