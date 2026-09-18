import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  AppstoreOutlined,
  LockOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  ProfileShell,
  TabBar,
  TabItem,
  ProfileContent,
} from './styles'
import ProfileInfoTab from './ProfileInfoTab'
import PasswordTab from './PasswordTab'
import LayoutTab from './LayoutTab'
import OmniTab from './OmniTab'

const PROFILE_TABS = [
  { key: 'profile', label: 'Hồ sơ', icon: UserOutlined },
  { key: 'password', label: 'Mật khẩu', icon: LockOutlined },
  { key: 'layout', label: 'Bố cục trang', icon: AppstoreOutlined },
  { key: 'omni', label: 'Kênh tin nhắn', icon: MessageOutlined },
]

/* Map key -> component, thay cho chuỗi ternary lồng nhau.
   Thêm tab sau này chỉ cần khai báo ở hai chỗ trên cùng file. */
const TAB_COMPONENTS = {
  profile: ProfileInfoTab,
  password: PasswordTab,
  layout: LayoutTab,
  omni: OmniTab,
}

const ProfilePage = () => {

  const [activeTab, setActiveTab] = useState('profile')
  const ActiveComponent = TAB_COMPONENTS[activeTab] || ProfileInfoTab

  const renderTabBar = () => (
    <TabBar>
      {PROFILE_TABS.map(({ key, label, icon: Icon }) => (
        <TabItem
          key={key}
          type="button"
          $active={activeTab === key}
          onClick={() => setActiveTab(key)}
        >
          <Icon />
          <span>{label}</span>
        </TabItem>
      ))}
    </TabBar>
  )

  return (
    <>
      <Helmet>
        <title>Hồ sơ</title>
      </Helmet>

      <ProfileShell>
        {renderTabBar()}
        <ProfileContent>
          <ActiveComponent />
        </ProfileContent>
      </ProfileShell>
    </>
  )
}

export default ProfilePage
