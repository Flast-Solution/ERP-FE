import { useState } from 'react';
import { Form, Space, List } from "antd";
import CustomButton from '@/components/CustomButton';
import useGetList from "@/hooks/useGetList";
import { dateFormatOnSubmit } from "@/utils/dataUtils";

const CustomList = ({
  apiPath = '',
  filter = '',
  grid = {},
  hasCreate = false,
  onClickCreate = (values) => values,
  renderItem = (record) => '',
  onData = (data) => data
}) => {

  const [ form ] = Form.useForm();
  const [ filterFormValues, setFilterFormValues ] = useState({
    apiPath,
    page: 1
  });

  const { data: { embedded, page }, loading } = useGetList({
    queryParams: filterFormValues,
    onData: onData
  });

  const handleFilterChange = (allValues) => {
    const formattedValues = { ...allValues };
    dateFormatOnSubmit(formattedValues, ['from', 'to']);
    setFilterFormValues(pre => ({...pre, ...formattedValues}));
  };

  const handlePageChange = (page, pageSize) => {
    setFilterFormValues(pre => ({...pre, page }));
  };

  const resetFilter = () => {
    form.resetFields();
    form.submit();
  }

  return (
    <div id="content-list">
      <Form onFinish={handleFilterChange} form={form}>
        { filter }
        <Space align='end'>
          <CustomButton title="Tìm kiếm" htmlType="submit" />
          <CustomButton title="Xóa lọc" variant="dashed" onClick={resetFilter} />
          { hasCreate && 
            <CustomButton title="Thêm mới" color="primary" variant="solid" onClick={onClickCreate} />
          }
        </Space>
      </Form>
      <List
        style={{marginTop: 20}}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4, ...grid }}
        dataSource={embedded}
        renderItem={renderItem}
        loading={loading}
        pagination={{
          current: filterFormValues?.page || 1,
          total: page?.totalElements || 0,
          pageSize: 10,
          onChange: handlePageChange,
          showSizeChanger: false
        }}
      />
    </div>
  )
};

export default CustomList;