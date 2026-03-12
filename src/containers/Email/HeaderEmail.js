import React from 'react';
import { Column, Heading, Img, Row, Section, Text, } from "@react-email/components";
import { BASE_URL } from "configs";

const headTitle = {
  margin: '0',
  fontWeight: "bold",
  fontSize: "16px"
}

const pstyle = {
  padding: "0px",
  margin: "0px"
};

const head_hotline = {
  ...pstyle,
  color: "#ffc40d",
  fontWeight: "bold",
  fontSize: "13px"
};

const head_email = {
  ...head_hotline,
  color: "#000",
};

const head_www = {
  ...head_hotline,
  color: "#39e7de",
};

export const HeaderEmail = () => {
  return (
    <Row>
      <Column style={{ width: "150px", borderRight: "2px solid #f9c727" }}>
        <Img
          src={`${BASE_URL}/unitika_logo.jpg`}
          width="120"
          height="36"
          alt="Slack"
        />
      </Column>
      <Column style={{ paddingLeft: "25px" }}>
        <Heading style={headTitle}>UNITIKA TRADING VIETNAM CO.,LTD</Heading>
        <Text style={pstyle}>
          601, 6th Floor, Indochina Plaza HaNoi, 241 Xuan Thuy str. <br />
          Dich Vong ward, Cau Giay dist., Ha Noi, Viet Nam.
        </Text>
        <Row style={{ textAlign: "left" }}>
          <Column style={{ width: "33%" }}>
            <Text style={head_hotline}>+84-912-810-158</Text>
          </Column>
          <Column style={{ width: "33%" }}>
            <Text style={head_email}>unitika.jp@gmail.com</Text>
          </Column>
          <Column style={{ width: "33%" }}>
            <Text style={head_www}>www.unitrade.co.jp</Text>
          </Column>
        </Row>
      </Column>
    </Row>
  )
};

export default HeaderEmail;
