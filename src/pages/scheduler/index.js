import React, { useEffect, useState } from 'react';
import TimeSheet from './TimeSheet';
import MyScheduner from './MyScheduner';
import useGetMe from 'hooks/useGetMe';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import useGetRestApi from 'hooks/useGetRestApi';
import FormSelectUser from 'components/form/FormSelectUser';
import { FilterContent } from './styles';
import { Dropdown, Button, Row, Col, Form, Badge } from 'antd';
import FormSelect from 'components/form/FormSelect';
import dayjs from 'dayjs';
import { APP_FOLLOW_STATUS_CONFIRM, APP_FOLLOW_STATUS_WAITING } from 'configs/constant';
import UserService from 'services/UserService';
import { arrayEmpty } from 'utils/dataUtils';

const title = 'Timesheet, work schedule';
const currentDate = dayjs();
const month = currentDate.month();
const year = currentDate.year();
const menus = (items, onClick) => {
  return arrayEmpty(items) ? [] : items.map((item) => ({
    label: (
      <Button
        size='small'
        onClick={() => onClick(item)}
      >
        {String(item.month)
          .concat("/")
          .concat(item.year)
          .concat(" (")
          .concat(UserService.fetchNameById(item.userId))
          .concat(" )")
        }
      </Button>
    ),
    key: item.id
  }))
}

const Scheduner = () => {
  const { user, isLeader, isManager } = useGetMe();
  const [ form ] = Form.useForm();
  const [ isTimeSheet, showTimeSheet ] = useState(false);
  const [ record, setRecord ] = useState({ userId: user.id, month, year });
  const [ items, setItems ] = useState([]);

  const [queryParams, setQueryParams] = useState({
    resource: 'time-sheet/fetch-tickes',
    limit: 100,
    userId: user.id,
    month: month + 1,
    year
  });

  const onSubmitFilter = (values) => {
    setQueryParams({ ...queryParams, ...values })
  }

  const onFilter = () => {
    form.validateFields().then(onSubmitFilter);
  };

  const beforeAppendData = (values) => {
    const items = values?.embedded ?? [];
    let uIds = items.map(i => i.userId);
    UserService.loadByIds(uIds);
    return items;
  }

  const { data } = useGetRestApi({
    queryParams,
    dataINdefault: [],
    onData: beforeAppendData
  });

  useEffect(() => {
    let rd = 0;
    if (isLeader()) {
      rd = (data || []).filter(i => i.status === APP_FOLLOW_STATUS_WAITING) ?? [];
    }
    if (isManager()) {
      rd = (data || []).filter(i => i.status === APP_FOLLOW_STATUS_CONFIRM) ?? [];
    }
    setItems(rd);
    /* eslint-disable-next-line */
  }, [data]);

  const onClickRecord = (red) => {
    setRecord(red);
  }

  return (
    <div className='my__content'>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Home' }, { title: title }]}
      />
      {isTimeSheet ?
        <Form
          layout='horizontal'
          form={form}
          onFinish={(values) => setQueryParams((pre) => ({ ...pre, ...values }))}
        >
          <Row style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Col className='c__action_calender' xs={24} md={19}>
              <FilterContent style={{ marginLeft: 0, width: '100%' }} gutter={16}>
                <Col xl={6} lg={6} md={6} xs={24}>
                  <FormSelectUser
                    allowClear
                    name={"userId"}
                    placeholder="Choise user"
                  />
                </Col>
                <Col xl={6} lg={6} md={6} xs={24}>
                  <FormSelect
                    allowClear
                    name={"month"}
                    placeholder="Choise month"
                    resourceData={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({ id: i, name: String(i) }))}
                  />
                </Col>
                <Col xl={6} lg={6} md={6} xs={24}>
                  <FormSelect
                    allowClear
                    name={"year"}
                    placeholder="Choise year"
                    resourceData={[2024, 2025, 2026].map(i => ({ id: i, name: String(i) }))}
                  />
                </Col>
                <Col xl={6} lg={6} md={6} xs={24}>
                  <Badge
                    count={items.length}
                    overflowCount={10}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Menu hiển thị các bảng chấm công để duyệt cửa Leader và Managerment */}
                    <Dropdown.Button
                      type="primary"
                      className="filterButton"
                      onClick={onFilter}
                      menu={{ items: menus(items, onClickRecord) }}
                    >
                      Filter
                    </Dropdown.Button>
                  </Badge>
                </Col>
              </FilterContent>
            </Col>
            <Col className='c__action_table m-top-20-xs' xs={24} md={5}>
              <Button color="primary" variant="dashed" onClick={() => showTimeSheet(true)}>Timesheet</Button>
              <Button color="danger" variant="outlined" style={{ marginLeft: 10 }} onClick={() => showTimeSheet(false)}>Scheduler</Button>
            </Col>
          </Row>
          <TimeSheet
            listTimesheet={data}
            {...record}
            month={queryParams.month}
            year={queryParams.year}
            userId={queryParams.userId}
          />
        </Form>
        :
        <MyScheduner showTimeSheet={showTimeSheet} />
      }
    </div>
  );
}

export default Scheduner;