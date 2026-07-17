import React from 'react'
import { Col, DatePicker, Input, Row, Select } from 'antd'
import { ClearOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons'
import { CustomButton } from '@flast-erp/core/components'
import { MANUFACTURE_STATUS_OPTIONS } from '../constants'

const ProductionOrderFilters = ({
  filters,
  loading = false,
  onUpdateFilter,
  onApply,
  onClear,
}) => (
  <div className="production-list-filter-wrapper">
    <Row gutter={16} align="middle">
      <Col xxl={20} xl={20} lg={18} md={24} xs={24}>
        <Row gutter={[16, 10]}>
          <Col xl={6} md={12} xs={24}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Mã lệnh sản xuất"
              value={filters.code}
              onChange={event => onUpdateFilter('code', event.target.value)}
              onPressEnter={onApply}
              allowClear
            />
          </Col>
          <Col xl={6} md={12} xs={24}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Mã đơn hàng"
              value={filters.orderCode}
              onChange={event => onUpdateFilter('orderCode', event.target.value)}
              onPressEnter={onApply}
              allowClear
            />
          </Col>
          <Col xl={6} md={12} xs={24}>
            <Select
              value={filters.status}
              onChange={value => onUpdateFilter('status', value)}
              placeholder="Trạng thái"
              allowClear
              options={MANUFACTURE_STATUS_OPTIONS}
            />
          </Col>
          <Col xl={6} md={12} xs={24}>
            <DatePicker.RangePicker
              value={filters.dateRange}
              onChange={value => onUpdateFilter('dateRange', value)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
              allowClear
            />
          </Col>
        </Row>
      </Col>
      <Col xxl={4} xl={4} lg={6} md={24} xs={24} className="production-list-filter-actions">
        <CustomButton
          title="Lọc"
          type="primary"
          icon={<FilterOutlined />}
          inRigth={false}
          loading={loading}
          onClick={onApply}
        />
        <CustomButton
          title="Xóa bộ lọc"
          variant="outlined"
          color="primary"
          icon={<ClearOutlined />}
          inRigth={false}
          disabled={loading}
          onClick={onClear}
        />
      </Col>
    </Row>
  </div>
)

export default ProductionOrderFilters
