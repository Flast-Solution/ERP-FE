/**************************************************************************/
/*  pages.kpi.index.js                                                    */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

import React, { useState, useCallback } from 'react'
import { Button, Pagination, Row, Col, Tooltip, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@/shared/components/BreadcrumbCustom';
import { InAppEvent } from '@/shared/utils/FuseUtils';
import { HASH_POPUP } from 'configs/constant';
import ListLayoutStyles from '@/shared/components/RestLayout/RestList/styles';
import { useEffectAsync } from '@/shared/hooks/MyHooks';
import RequestUtils from '@/shared/utils/RequestUtils';
import { arrayEmpty, formatMoney } from '@/shared/utils/dataUtils';
import {
  KanbanCardWrapper,
  TitleWrapper,
  Title,
  NoteIcon,
  MetaInfo,
  TagsContainer,
  DateText,
  AssigneeAvatar,
  getInitials
} from 'css/cardStyle';
import UserService from 'services/UserService';

const TITLE = "Thiết lập KPI";
const CURRENT_DATE = new Date();

const KpiPage = () => {

  const [ data, setKPI ] = useState({});
  const [ filter ] = useState({ 
    month: CURRENT_DATE.getMonth() + 1, 
    year: CURRENT_DATE.getFullYear()
  });

  const fetchKPI = useCallback(async (params = {}) => {
    const { data } = await RequestUtils.Get("/kpi/fetch", {...filter, ...params});
    if(arrayEmpty(data.embedded)) {
      return;
    }
    const { embedded } = data;
    const userIds = embedded.map(i => i.userId);
    const mUser = await UserService.mapId2Name(userIds);
    for(let item of embedded) {
      item.ssoId = mUser[item.userId];
      item.inTime = new Date(String(item.year).concat("-").concat(item.month).concat("-01"));
    }
    setKPI(data);
  }, [ filter ]);
  
  const onClickAddKPI = useCallback((kpi = {}) => {
    const onAfterSubmit = (values) => {
      fetchKPI();
    };
    InAppEvent.emit(HASH_POPUP, {
      hash: "kpi.add",
      title: "Thiết lập KPI mới",
      data: { onSave: onAfterSubmit, kpi }
    });
  }, [fetchKPI]);

  useEffectAsync( async() => {
    fetchKPI();
  }, []);

  const onChangePagination = useCallback(async (page) => {
    fetchKPI();
    /* eslint-disable-next-line */
  }, []);

  const mPageProps = {
    current: filter?.page ?? 1,
    pageSize: 10,
    total: data?.page?.totalElements ?? 0,
    showQuickJumper: false,
    showTotal: (total, range) => `${range[0]}-${range[1]}/${total}`
  };

  return (
    <div>
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: TITLE }]}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3>Bảng KPI trong tháng {filter.month}</h3>
        <Button type="primary" onClick={onClickAddKPI}>Thêm mới KPI</Button>
      </div>
      <ListLayoutStyles>
        <Row gutter={16} >
          {(data?.embedded || []).map(item => 
            <Col key={item.id}>
              <KPICard onAdd={onClickAddKPI} item={item} />
            </Col>
          )}
        </Row>
        <div className="list-layout__pagination-bottom">
          <Pagination {...mPageProps} onChange={onChangePagination} />
        </div>
      </ListLayoutStyles>
    </div>
  )
}

const KPICard = ({ item, onAdd }) => {
  const { listKpi } = item;
  return (
    <KanbanCardWrapper>
      <TitleWrapper>
        <Title ellipsis={{ tooltip: 'Sửa KPI' }}>
          {item.ssoId}
        </Title>
        <Tooltip title="KPI tháng">
          <NoteIcon onClick={() => onAdd(item)} />
        </Tooltip>
      </TitleWrapper>
      { listKpi?.map( (kpi, key) => (
        <MetaInfo key={key} style={{marginBottom: 10}}>
          <TagsContainer>
            <DateText>📅 {item.month} - {item.year}</DateText>
            <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: '12px', padding: '0 8px' }}>
              {formatMoney(kpi.target)}
            </Tag>
          </TagsContainer>
          <AssigneeAvatar>
            {getInitials(kpi.name)}
          </AssigneeAvatar>
        </MetaInfo>
      ))}
    </KanbanCardWrapper>
  )
}

export default KpiPage
