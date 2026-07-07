/**************************************************************************/
/*  UserInfo.js                                                           */
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

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { GlobalOutlined, LogoutOutlined, ProfileOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown } from 'antd';
import useGetMe from '@/hooks/useGetMe';
import moment from 'moment';
import { UserDropdownPanel } from './styles';

const LANGUAGE = [
  { value: 'en', text: 'EN' },
  { value: 'vi', text: 'VI' }
];

function UserInfo() {

  const { t, i18n } = useTranslation();
  const [locale, setLocale] = useState(i18n.language);
  const { user: profile } = useGetMe();

  const changeLocale = useCallback(e => {
    setLocale(e);
    i18n.changeLanguage(e);
    moment.locale(e);
    localStorage.setItem('locale', e);
  }, [i18n]);

  useEffect(() => {
    setLocale(i18n.language);
  }, [i18n.language]);

  const handleLogout = () => {
    localStorage.removeItem('jwt_access_token');
    window.location.href = '/login';
  };

  const dropdownContent = (
    <UserDropdownPanel>
      <div className="user-dropdown-section">
        <Link to="/profile" className="user-dropdown-row">
          <ProfileOutlined className="user-dropdown-icon" />
          <span>{t('header.profile')}</span>
        </Link>

        <div className="user-dropdown-row user-dropdown-row-language">
          <GlobalOutlined className="user-dropdown-icon" />
          <span>Language</span>
        </div>

        <div className="user-dropdown-language-actions">
          {LANGUAGE.map(item => {
            const active = locale?.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                className={active ? 'active' : ''}
                onClick={() => changeLocale(item.value)}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" className="user-dropdown-logout" onClick={handleLogout}>
        <LogoutOutlined className="user-dropdown-icon" />
        <span>{t('header.logout')}</span>
      </button>
    </UserDropdownPanel>
  );

  return (
    <div>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        dropdownRender={() => dropdownContent}
      >
        <div className="div-user-info">
          <span className="userInfo">
            <strong>{profile?.fullName ?? 'Flast Solution'}</strong>
            <span className="role">{profile?.type ?? 'Open-CDP'}</span>
          </span>
          <Avatar size="large" src={profile?.avatar} icon={<UserOutlined />} />
        </div>
      </Dropdown>
    </div>
  );
}

export default UserInfo;
