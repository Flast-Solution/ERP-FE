/**************************************************************************/
/*  index.js                                                           		*/
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
import { useState } from 'react';
import { 
  Button, 
  Tag, 
  Progress, 
  Space, 
  Avatar, 
  Tooltip, 
  Typography,
  Slider,
  message,
  Popconfirm
} from 'antd';
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from 'components/BreadcrumbCustom';
import Filter from './Filter';
import useGetList from "hooks/useGetList";
import RestList from 'components/RestLayout/RestList';
import { arrayEmpty, dateFormatOnSubmit, f5List, formatMoney, formatTime } from 'utils/dataUtils';
import { useCallback } from 'react';
import { InAppEvent } from 'utils/FuseUtils';
import { HASH_MODAL } from 'configs';
import {
  CalendarOutlined, 
  DollarCircleOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { DEPARTMENT_MAP_KEYS_VALUE } from 'configs/localData';
import UserService from 'services/UserService';
import RequestUtils from 'utils/RequestUtils';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  'Not Started': 'default',
  'In Progress': 'processing',
  'Completed': 'success',
  'On Hold': 'warning'
};
const { Text, Paragraph } = Typography;

const getRandomColor = (name) => {
  if (!name) return '#f56a00';
  const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff', '#52c41a', '#eb2f96'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const UserAvatar = ({ name, size = 'default' }) => {
  const getInitials = (name) => {
    if (!name) return '';
    return name.substring(0, 2).toUpperCase();
  };
  return (
    <Avatar 
      size={size} 
      style={{ backgroundColor: getRandomColor(name) }}
    >
      {getInitials(name)}
    </Avatar>
  )
};

const TITLE = "Danh sách dự án nội bộ";
const TASK = () => {

  const navigate = useNavigate();
  const [ editingProgress, setEditingProgress ] = useState(null);
  const [ tempProgress, setTempProgress ] = useState(0);

  const onEdit = useCallback((record = {}) => {
    InAppEvent.emit(HASH_MODAL, {
      hash: '#draw/work.edit',
      title: 'Cập nhật dự án #' + (record.id || 'Mới'),
      data: record
    });
  }, []);

  const onDelete = useCallback(async (id) => {
    const { message: MSG } = await RequestUtils.Post("/works/delete/" + id, {});
    message.info(MSG);
    f5List("works/fetch");
  }, []);

  const onView = useCallback(async (id) => {
    navigate(String("/task/calendar/").concat(id));
  }, [navigate]);

  const startEditingProgress = (projectId, currentProgress) => {
    setEditingProgress(projectId);
    setTempProgress(currentProgress);
  };

  const cancelEditingProgress = () => {
    setEditingProgress(null);
    setTempProgress(0);
  };

  const saveProgress = async (record) => {
    const { message: MSG } = await RequestUtils.Post("/works/save", {...record, progress: tempProgress });
    message.info(MSG);
    f5List("works/fetch");
    setEditingProgress(null);
  };

  const CUSTOM_ACTION = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 250,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Paragraph 
            type="secondary" 
            style={{ fontSize: '12px', marginBottom: 0, marginTop: '4px' }}
            ellipsis={{ rows: 1, tooltip: record.description }}
          >
            {record.description}
          </Paragraph>
        </div>
      )
    },
    {
      title: 'Phòng ban',
      dataIndex: 'departmentId',
      width: 120,
      render: (departmentId) => (
        <Tag color={DEPARTMENT_MAP_KEYS_VALUE[departmentId]?.color ?? 'orange'}>
          {DEPARTMENT_MAP_KEYS_VALUE[departmentId]?.name ?? '(Chưa có)'}
        </Tag>
      )
    },
    {
      title: 'Quản lý',
      dataIndex: 'ssoId',
      width: 150
    },
    {
      title: 'Bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 140,
      render: (startDate) => (
        <div>
          <CalendarOutlined style={{ marginRight: '4px' }} />
          {formatTime(startDate)}
        </div>
      )
    },
    {
      title: 'Kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 140,
      render: (endDate) => (
        <div>
          <CalendarOutlined style={{ marginRight: '4px' }} />
          {formatTime(endDate)}
        </div>
      )
    },
    {
      title: 'Ngân sách',
      dataIndex: 'budget',
      key: 'budget',
      width: 150,
      render: (budget) => (
        <div>
          <DollarCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
          {formatMoney(budget)}
        </div>
      )
    },
    {
      title: 'Thành viên',
      dataIndex: 'listMember',
      key: 'listMember',
      width: 180,
      render: (listMember) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar.Group 
            max={{ count: 3 }} 
            size="small"
          >
            {listMember.map(member => (
              <Tooltip key={member} title={member}>
                <UserAvatar name={member} />
              </Tooltip>
            ))}
          </Avatar.Group>
          <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
            {listMember.length} người
          </Text>
        </div>
      )
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 250,
      render: (_, record) => editingProgress === record.id ? (
        <div>
          <Slider 
            value={tempProgress} 
            onChange={setTempProgress}
            marks={{ 0: '0%', 100: '100%' }}
            style={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">{tempProgress}%</Text>
            <Space>
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckOutlined />} 
                onClick={() => saveProgress(record)}
              />
              <Button 
                size="small" 
                icon={<CloseOutlined />} 
                onClick={cancelEditingProgress}
              />
            </Space>
          </div>
        </div>
      ) : (
        <div>
          <Progress percent={record.progress} size="small" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <Text style={{ fontSize: '12px' }}>{record.progress}%</Text>
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => startEditingProgress(record.id, record.progress)}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      width: 100
    },
    {
      title: 'Hành động',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => onView(record.id)} 
          />
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => onEdit(record)} 
          />
          <Popconfirm
            title="Xóa dự án"
            description="Bạn có chắc chắn muốn xóa dự án này ?"
            okText="Đồng ý"
            cancelText="Hủy"
            onConfirm={() => onDelete(record.id)}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const beforeSubmitFilter = useCallback((values) => {
    dateFormatOnSubmit(values, ['from', 'to']);
    return values;
  }, []);

  const onData = useCallback(async (values) => {
    if(arrayEmpty(values?.embedded)) {
      return values;
    }
    let { embedded } = values;
    const ids = embedded.map(i => i.managerId);
    const mUser = await UserService.mapId2Name(ids);
    for(let item of embedded) {
      item.ssoId = mUser[item.managerId] || '';
    }
    return values;
  }, [])

  return (
    <div>
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: TITLE }]}
      />
      <RestList
        xScroll={1200}
        onData={onData}
        initialFilter={{ limit: 10, page: 1 }}
        filter={<Filter />}
        beforeSubmitFilter={beforeSubmitFilter}
        useGetAllQuery={useGetList}
        apiPath={'works/fetch'}
        hasCreate={true}
        customClickCreate={onEdit}
        columns={CUSTOM_ACTION}
      />
    </div>
  )
}

export default TASK;