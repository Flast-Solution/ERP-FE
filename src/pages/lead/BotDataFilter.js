import React, { useContext, useState } from 'react';
import { Row, Col, Button } from 'antd';
import axios from 'axios';
import { PlusCircleOutlined } from '@ant-design/icons';
import RequestUtils from 'utils/RequestUtils';
import { InAppEvent } from 'utils/FuseUtils';
import FormInput from 'components/form/FormInput';
import FormCheckbox from 'components/form/FormCheckbox';
import { FormContextCustom } from 'components/context/FormContextCustom';
import { GATEWAY, HASH_MODAL } from 'configs';

const BotDataFilter = () => {

  const { form } = useContext(FormContextCustom);
  const [ loading, setLoading ] = useState(false);

  const onCreate = () => InAppEvent.emit(HASH_MODAL, { 
    hash: '#draw/lead.collection', 
    title: 'Thêm mới Lead lạnh',
    data: {} 
  });

  const dowloadData = async (page) => {
    const field = form.getFieldsValue();
    const { data } = await RequestUtils.Get('/data-collection/count-num-record', field);
    setLoading(true);
    try {
      const itemsPerPage = 500;
      const totalPages = Math.ceil(data / itemsPerPage);
      const response = await axios.get(`${GATEWAY}/data-collection/to-excel`, {
        responseType: 'arraybuffer',
        params: { ...field, limit: itemsPerPage, page: page },
        headers: { 'Content-Type': 'application/json' }
      });
      if(response.data) {
        setLoading(false);
      }
      const type = response.headers['content-type'];
      const blob = new Blob([response.data], { type: type, encoding: 'UTF-8' });

      /* Download the file */
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${Date.now()}_page_${page}.xlsx`);
      link.click();

      if (page < totalPages) {
        await dowloadData(page + 1);
      } else {
        setLoading(false);
      }
    } catch (err) {
      InAppEvent.normalError("Lỗi export dữ liệu quá thời gian cho phép!");
      setLoading(false);
    }
  }

  return (
    <>
      <Row gutter={16}>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'number'}
            placeholder="Số điện thoại"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'address'}
            placeholder="Địa chỉ hoặc nghề nghiệp"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <FormInput
            name={'group_name'}
            placeholder="Tên nhóm"
          />
        </Col>
        <Col xl={6} lg={6} md={6} xs={24}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <FormCheckbox
              name={'withMobile'}
              text="Chỉ lấy danh sách có SĐT"
            />
          </div>
        </Col>
      </Row>
      <div style={{ display: 'flex', justifyContent: 'start', gap: 15, marginBottom: 15 }}>
        <Button id='expdata'
          style={{ background: '#5BBFB3', color: '#fff', borderRadius: 3 }}
          loading={loading}
          onClick={(() => dowloadData(1))}
        >
          Download File Excel
        </Button>
        <Button className="add-gr" type="primary" onClick={onCreate}>
          <PlusCircleOutlined /> Nhập thêm
        </Button>
      </div>
    </>
  );
}

export default BotDataFilter;