/**************************************************************************/
/*  FormSelectAPI.js                                                      */
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

import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import RequestUtils from 'utils/RequestUtils';
import { Form, Select, Spin, Divider, Input, Button, message } from 'antd';
import { get } from 'lodash';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import MyContext from 'DataContext';
import { useUpdateEffect, useMount } from "hooks/MyHooks";
import { PlusOutlined } from '@ant-design/icons';
import { SUCCESS_CODE } from 'configs';
import { arrayEmpty } from "utils/dataUtils"

const { Option } = Select;
const FormSelectAPI = ({
  apiPath = '',
  apiAddNewItem = '',
  name,
  label = '',
  required,
  messageRequire = 'error.required',
  placeholder = 'placeholder.select',
  rules = [],
  valueProp = 'id',
  titleProp = 'name',
  isFetchOnMount = true,
  formatText = value => value,
  formatValue = value => value,
  searchKey = 'name',
  initialValue,
  formItemProps,
  isShowModalCreateNewItem,
  onChangeGetSelectedItem,
  onCreateNewItem = () => false,
  isLimitWidth = false,
  filter,
  createDefaultValues,
  onData = (values) => values,
  fnLoadData,
  title = '',
  ...props
}) => {

  const { f5List } = useContext(MyContext);
  const [localFilter, setLocalFilter] = useState(filter || {});
  const [loading, setLoading] = useState(false);
  const [resourceData, setData] = useState([]);
  const [value, setValue] = useState('');

  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  useMount(() => {
    if (isFetchOnMount && arrayEmpty(resourceData)) {
      fetchResource(localFilter);
    }
  });

  const fetchResource = useCallback((values) => {
    if (!apiPath) {
      return;
    }
    if (fnLoadData) {
      Promise.resolve(fnLoadData(values)).then(onData).then(data => {
        setData(data)
      });
      return;
    }
    setLoading(true);
    RequestUtils.Get('/' + apiPath, values).then(async ({ data, errorCode }) => {
      if (errorCode !== 200) {
        return Promise.reject("Get not success from server .!");
      }
      Promise.resolve(onData(data)).then(data => {
        setData(data)
      })
      setLoading(false);
    }).catch(e => {
      console.log('[form.FormSelectAPI] Error ', e);
      setLoading(false);
    });
    /* eslint-disable-next-line */
  }, [onData, apiPath]);

  useUpdateEffect(() => {
    if (f5List?.apiPath === apiPath || (localFilter?.forceUpdate ?? false) !== false) {
      fetchResource(localFilter);
    }
    /* eslint-disable-next-line */
  }, [f5List, localFilter, apiPath]);

  const { t } = useTranslation();
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

  const addItem = useCallback(async () => {
    /* Open Modal Create Data */
    if (onCreateNewItem()) {
      return;
    }
    if (!value || !apiAddNewItem) {
      return;
    }
    let dataPost = { [searchKey]: value, ...(createDefaultValues || {}) }
    const { data, errorCode, message: msg } = await RequestUtils.Post("/" + apiAddNewItem, dataPost);
    if (errorCode === SUCCESS_CODE) {
      const newData = resourceData.concat(data);
      setData(newData);
      setValue('');
    }
    message.info(msg);
    /* eslint-disable-next-line */
  }, [value, createDefaultValues, fnLoadData]);

  const onSearch = useCallback((value) => {
    fetchResource({ ...localFilter, [searchKey]: value });
    /* eslint-disable-next-line */
  }, [localFilter, searchKey]);

  const handleValueInput = (e) => {
    setValue(e.target.value);
  }

  const handleChange = (value) => {
    if (!onChangeGetSelectedItem) return;
    const findItem = resourceData?.find(
      (item) => get(item, valueProp) === value,
    );
    onChangeGetSelectedItem(value, findItem);
  };

  return (
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
        filterOption={false}
        popupMatchSelectWidth={isLimitWidth}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ padding: "0 8px 4px", display: "flex", alignItems: "end" }} >
              {!isShowModalCreateNewItem &&
                <Input
                  style={{ width: '100%' }}
                  placeholder="Add new item"
                  value={value}
                  onChange={handleValueInput}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              }
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={addItem}
                color="primary"
                variant="dashed"
                style={{ marginLeft: 20 }}
              >
                Add item
              </Button>
            </div>
          </>
        )}
        options={
          resourceData?.map((item) => ({
            label: formatText(titleProp ? get(item, titleProp) : item, item),
            value: formatValue(valueProp ? get(item, valueProp) : item, item)
          }))
        }
        onSearch={debounce(onSearch, 600)}
        onChange={handleChange}
        {...props}
      >
        {loading && optionLoading}
      </Select>
    </Form.Item>
  );
}

export default FormSelectAPI;