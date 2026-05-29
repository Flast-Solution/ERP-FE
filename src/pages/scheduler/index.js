import React, { useEffect, useState } from 'react';
import TimeSheet from './TimeSheet';
import MyScheduner from './MyScheduner';
import useGetMe from '@flast-erp/core/hooks/useGetMe';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@flast-erp/core/components/BreadcrumbCustom';
import useGetRestApi from '@flast-erp/core/hooks/useGetRestApi';
import FormSelectUser from '@/form-flast/FormSelectUser';
import { FilterContent, SchedulerWrapper, SchedulerHeader, HeaderLeft, HeaderTitle, NavGroup, CalendarBody } from './styles';
import { Dropdown, Button, Col, Form, Badge } from 'antd';
import FormSelect from '@/form-flast/FormSelect';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { APP_FOLLOW_STATUS_CONFIRM, APP_FOLLOW_STATUS_WAITING } from '@/configs/constant';
import UserService from 'services/UserService';
import { arrayEmpty } from '@flast-erp/core/utils/dataUtils';
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
  const { t } = useTranslation();
  const { user, isLeader, isManager } = useGetMe();
  const pageTitle = t('calendarPage.title');
  const [ form ] = Form.useForm();
  const [ isTimeSheet, showTimeSheet ] = useState(false);
  const [ record, setRecord ] = useState({ userId: user.id, month, year });
  const [ items, setItems ] = useState([]);

  const [queryParams, setQueryParams] = useState({
    resource: 'erp/time-sheet/fetch-tickes',
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
    const dataArray = Array.isArray(data) ? data : [];
    let rd = [];
    if (isLeader()) {
      rd = dataArray.filter(i => i.status === APP_FOLLOW_STATUS_WAITING);
    }
    if (isManager()) {
      rd = dataArray.filter(i => i.status === APP_FOLLOW_STATUS_CONFIRM);
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
        <title>{pageTitle}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: t('calendarPage.breadcrumbHome') }, { title: pageTitle }]}
      />
      {isTimeSheet ? (
        <SchedulerWrapper>
          <Form
            layout='horizontal'
            form={form}
            onFinish={(values) => setQueryParams((pre) => ({ ...pre, ...values }))}
          >
            <SchedulerHeader>
              <HeaderLeft>
                <HeaderTitle>{t('calendarPage.timesheetHeader')}</HeaderTitle>
                <FilterContent style={{ marginLeft: 0, width: 'auto', flex: 1 }} gutter={16}>
                  <Col xl={5} lg={6} md={8} xs={24}>
                    <FormSelectUser
                      allowClear
                      name={"userId"}
                      placeholder={t('calendarPage.selectEmployee')}
                    />
                  </Col>
                  <Col xl={4} lg={5} md={6} xs={24}>
                    <FormSelect
                      allowClear
                      name={"month"}
                      placeholder={t('calendarPage.selectMonth')}
                      resourceData={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => ({ id: i, name: String(i) }))}
                    />
                  </Col>
                  <Col xl={4} lg={5} md={6} xs={24}>
                    <FormSelect
                      allowClear
                      name={"year"}
                      placeholder={t('calendarPage.selectYear')}
                      resourceData={[2024, 2025, 2026].map(i => ({ id: i, name: String(i) }))}
                    />
                  </Col>
                  <Col xl={6} lg={6} md={4} xs={24}>
                    <Badge count={items.length} overflowCount={10} style={{ cursor: 'pointer' }}>
                      <Dropdown.Button
                        type="primary"
                        onClick={onFilter}
                        menu={{ items: menus(items, onClickRecord) }}
                      >
                        {t('calendarPage.filter')}
                      </Dropdown.Button>
                    </Badge>
                  </Col>
                </FilterContent>
              </HeaderLeft>
              <NavGroup>
                <Button type="primary" ghost onClick={() => showTimeSheet(true)}>{t('calendarPage.timesheet')}</Button>
                <Button style={{ marginLeft: 8 }} onClick={() => showTimeSheet(false)}>{t('calendarPage.scheduler')}</Button>
              </NavGroup>
            </SchedulerHeader>
            <CalendarBody>
              <TimeSheet
                listTimesheet={Array.isArray(data) ? data : []}
                {...record}
                month={queryParams.month}
                year={queryParams.year}
                userId={queryParams.userId}
              />
            </CalendarBody>
          </Form>
        </SchedulerWrapper>
      ) : (
        <MyScheduner showTimeSheet={showTimeSheet} />
      )}
    </div>
  );
}

export default Scheduner;