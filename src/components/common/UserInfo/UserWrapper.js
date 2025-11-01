/**************************************************************************/
/*  UserWrapper.js                                                        */
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

import { useTranslation } from 'react-i18next';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import UserInfoStyles from './styles';

const UserWrapper = ({
  item,
  avatarProp = 'avatar',
  nameProp = 'name',
  noteProp,
  customNote,
  disabled,
  path,
  size,
}) => {
  const { t } = useTranslation();
  const element = (
    <div className="user-info-wrapper">
      <Avatar size={size} src={item?.[avatarProp]} icon={<UserOutlined />} />
      <div className="user-content">
        <div className="user-name ellipsis-2-t">
          {item?.[nameProp] || t('error.waitingUpdate')}
        </div>
        <div className="user-note">
          {noteProp ? item?.[noteProp] : customNote}
        </div>
      </div>
    </div>
  );

  return (
    <UserInfoStyles>
      {!path || disabled ? (
        element
      ) : (
        <Link className="link-default" to={path}>
          {element}
        </Link>
      )}
    </UserInfoStyles>
  );
};

export default UserWrapper;
