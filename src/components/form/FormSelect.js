/**************************************************************************/
/*  FormSelect.js                                                         */
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

import { useMemo, useCallback } from 'react';
import { Form, Select, Spin, Tooltip } from 'antd';
import { map, isObject, get } from 'lodash';
import { Waypoint } from 'react-waypoint';
import { useTranslation } from 'react-i18next';
import { onSearch as onChangeSearch } from 'utils/tools';

const { Option } = Select;

const FormSelect = ({
  name,
  label = '',
  required,
  messageRequire = 'error.required',
  placeholder = 'placeholder.select',
  rules = [],
  resourceData,
  valueProp = 'id',
  titleProp = 'name',
  isFilterOption = true,
  formatText = value => value,
  formatValue = value => value,
  searchKey = 'name',
  loading,
  onEnter,
  enableWaypoint,
  initialValue,
  formItemProps,
  isShowTooltip,
  onChangeGetSelectedItem,
  onChange,
  isLimitWidth = false,
  ...props
}) => {
  const { t } = useTranslation();
  const onSelectOption = useCallback((inputValue, option) => {
    const data = isObject(option.children) ? get(option.children.props?.record, searchKey) : option.children;
    if (onChangeSearch(data, inputValue)) {
      return option.value;
    }
    return null;
  }, [searchKey]);

  const optionWaypoint = (
    <Option
      className="loading-select-option"
      disabled
      value="waypointTracking"
      key="waypoint"
    >
      <div style={{ height: 1 }}>
        <Waypoint onEnter={onEnter} />
      </div>
    </Option>
  );

  const optionLoading = useMemo(() => {
    return (
      <Option
        className="loading-select-option"
        disabled
        value="loadingTracking"
        key="loading"
      >
        <div className="loading-select">
          <Spin />
        </div>
      </Option>
    );
  }, []);

  const handleChange = (value) => {
    if (!onChangeGetSelectedItem) return;
    const findItem = resourceData?.find(
      (item) => get(item, valueProp) === value,
    );
    onChangeGetSelectedItem(value, findItem);
  };
  const formItem = (
    <Form.Item
      label={t(label)}
      name={name}
      rules={[
        { required, message: t(messageRequire) },
        ...rules
      ]}
      initialValue={initialValue}
      {...formItemProps}
    >
      <Select
        placeholder={t(placeholder)}
        filterOption={isFilterOption ? onSelectOption : false}
        popupMatchSelectWidth={isLimitWidth}
        {...props}
        onChange={onChange || handleChange}
      >
        {map(resourceData, (data, index) => (
          <Option
            key={String(index)}
            value={formatValue(valueProp ? get(data, valueProp) : data, data)}
          >
            {formatText(titleProp ? get(data, titleProp) : data, data)}
          </Option>
        ))}
        {enableWaypoint && optionWaypoint}
        {loading && optionLoading}
      </Select>
    </Form.Item>
  );

  return isShowTooltip ? (
    <Tooltip title={placeholder ? t(placeholder) : ''}>{formItem}</Tooltip>
  ) : (
    formItem
  );
};

export default FormSelect;
