import { Form, Col, Row } from 'antd';
import CustomButton from 'components/CustomButton';
import FormDatePicker from 'components/form/FormDatePicker';
import FormInput from 'components/form/FormInput';
import FormRadioGroup from 'components/form/FormRadioGroup';
import FormSelect from 'components/form/FormSelect';
import FormSelectUser from 'components/form/FormSelectUser';
import RestEditModal from 'components/RestLayout/RestEditModal';
import { SUCCESS_CODE } from 'configs';
import useGetMe from 'hooks/useGetMe';
import { initialCalendars } from 'pages/scheduler/utils';
import { useCallback } from 'react';
import { dateFormatOnSubmit } from 'utils/dataUtils';
import { InAppEvent } from 'utils/FuseUtils';
import RequestUtils from 'utils/RequestUtils';

const SETTUP_PEOPLE = [
  { type: 'persional', text: 'Persional' },
  { type: 'department', text: 'Users' },
  { type: 'all', text: 'All' }
]

const AddAction = ({ closeModal, data }) => {

  const { user } = useGetMe();
  const onSubmit = useCallback(async (values) => {
    const { people, userIds, ...params } = values;
    let event = {
      ...params,
      isAllday: false,
      category: 'time',
      dueDateClass: '',
      isPrivate: true,
      isVisible: true,
      isReadOnly: false,
      isPending: false,
      isFocused: false,
      userId: user.id
    };
    dateFormatOnSubmit(event, ['start', 'end']);
    let api = people === "persional" ? "/calendar/create" : "/calendar/setup-meeting";
    if (people === "department") {
      event.userIds = userIds;
      event.typeUser = 1;
    } else if (people === "all") {
      event.userIds = "";
      event.typeUser = 2;
    }
    const { data: ret, errorCode } = await RequestUtils.Post(api, event);
    const isSuccess = errorCode === SUCCESS_CODE;
    if (isSuccess && (ret.id ?? 0) !== 0) {
      data?.callback?.(ret);
    }
    InAppEvent.normalInfo(isSuccess ? 'Created event success .!' : 'Error created event .!');
  }, [user, data]);

  return (
    <RestEditModal
      onSubmit={onSubmit}
      record={{}}
      closeModal={closeModal}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <FormDatePicker
            style={{ width: '100%' }}
            name="start"
            placeholder="Start of event"
            label="Choise start of event"
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormDatePicker
            style={{ width: '100%' }}
            name="end"
            placeholder="End of event"
            label="Choise end of event"
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormSelect
            resourceData={initialCalendars}
            name="calendarId"
            placeholder="Choise type of event"
            label="Type of event"
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormRadioGroup
            resourceData={SETTUP_PEOPLE}
            name="people"
            titleProp='text'
            valueProp='type'
            label="User Or Department"
            required
          />
        </Col>
        <Col md={24} xs={24}>
          <Form.Item noStyle
            shouldUpdate={(prevValues, curValues) => prevValues.people !== curValues.people}
          >
            {({ getFieldValue }) => {
              const people = getFieldValue('people');
              return people === 'department' ? (
                <FormSelectUser
                  mode="multiple"
                  name="userIds"
                  placeholder="Join Users"
                  label="Users list"
                  required
                />
              ) : ('');
            }}
          </Form.Item>
        </Col>
        <Col xs={24} md={24}>
          <FormInput
            name="title"
            placeholder="Short title"
            label="Title"
            required
          />
        </Col>
        <Col xs={24} md={24}>
          <CustomButton
            htmlType="submit"
            title="Tạo mới"
            color="danger"
            variant="solid"
          />
        </Col>
      </Row>
    </RestEditModal>
  )
}

export default AddAction;