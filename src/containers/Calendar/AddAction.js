import { Form, Col, Row } from 'antd';
import CustomButton from '@erp/shared/dist/components/CustomButton';
import FormDatePicker from '@erp/shared/dist/components/form/FormDatePicker';
import FormInput from '@erp/shared/dist/components/form/FormInput';
import FormRadioGroup from '@erp/shared/dist/components/form/FormRadioGroup';
import FormSelect from '@erp/shared/dist/components/form/FormSelect';
import FormSelectUser from '@erp/shared/dist/components/form/FormSelectUser';
import RestEditModal from '@erp/shared/dist/components/RestLayout/RestEditModal';
import { SUCCESS_CODE } from 'configs';
import useGetMe from '@erp/shared/dist/hooks/useGetMe';
import { buildCalendarsWithNames } from 'pages/scheduler/utils';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dateFormatOnSubmit } from '@erp/shared/dist/utils/dataUtils';
import { InAppEvent } from '@erp/shared/dist/utils/FuseUtils';
import RequestUtils from '@erp/shared/dist/utils/RequestUtils';

const AddAction = ({ closeModal, data }) => {

  const { t } = useTranslation();
  const calendarOptions = useMemo(() => buildCalendarsWithNames(t), [t]);
  const scopeOptions = useMemo(() => [
    { type: 'persional', text: t('calendarPage.addModal.scopePersonal') },
    { type: 'department', text: t('calendarPage.addModal.scopeDepartment') },
    { type: 'all', text: t('calendarPage.addModal.scopeAll') },
  ], [t]);
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
    InAppEvent.normalInfo(isSuccess ? t('calendarPage.addModal.createSuccess') : t('calendarPage.addModal.createError'));
  }, [user, data, t]);

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
            placeholder={t('calendarPage.addModal.placeholderStart')}
            label={t('calendarPage.addModal.labelStart')}
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormDatePicker
            style={{ width: '100%' }}
            name="end"
            placeholder={t('calendarPage.addModal.placeholderEnd')}
            label={t('calendarPage.addModal.labelEnd')}
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormSelect
            resourceData={calendarOptions}
            name="calendarId"
            placeholder="calendarPage.addModal.placeholderEventType"
            label="calendarPage.addModal.labelEventType"
            required
          />
        </Col>
        <Col xs={24} md={12}>
          <FormRadioGroup
            resourceData={scopeOptions}
            name="people"
            titleProp='text'
            valueProp='type'
            label="calendarPage.addModal.labelScope"
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
                  placeholder="calendarPage.addModal.placeholderJoinUsers"
                  label="calendarPage.addModal.labelUsersList"
                  required
                />
              ) : ('');
            }}
          </Form.Item>
        </Col>
        <Col xs={24} md={24}>
          <FormInput
            name="title"
            placeholder="calendarPage.addModal.placeholderTitle"
            label="calendarPage.addModal.labelTitleField"
            required
          />
        </Col>
        <Col xs={24} md={24}>
          <CustomButton
            htmlType="submit"
            title="calendarPage.addModal.submitCreate"
            color="danger"
            variant="solid"
          />
        </Col>
      </Row>
    </RestEditModal>
  )
}

export default AddAction;