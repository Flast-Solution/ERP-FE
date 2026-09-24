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

const getInitialTab = () => {
  const tab = new URLSearchParams(window.location.search).get('tab')
  return TAB_COMPONENTS[tab] ? tab : 'profile'
}

const PROFILE_TABS = [
  { key: 'profile', label: 'Hồ sơ', icon: UserOutlined },
  { key: 'password', label: 'Mật khẩu', icon: LockOutlined },
  { key: 'layout', label: 'Bố cục trang', icon: AppstoreOutlined },
  { key: 'omni', label: 'Kênh tin nhắn', icon: MessageOutlined },
]

const TAB_COMPONENTS = {
  profile: ProfileInfoTab,
  layout: LayoutTab,
  omni: OmniTab,
  password: PasswordTab
}

const ProfilePage = () => {

  const [ activeTab, setActiveTab ] = useState(getInitialTab)
  const ActiveComponent = TAB_COMPONENTS[activeTab] || ProfileInfoTab

  const handleChangeTab = (key) => {
    setActiveTab(key)
    /* Giữ tab trên URL để F5 / chia sẻ link vẫn đúng tab */
    const url = new URL(window.location.href)
    url.searchParams.set('tab', key)
    window.history.replaceState(window.history.state, '', url)
  }

  const renderTabBar = () => (
    <TabBar>
      {PROFILE_TABS.map(({ key, label, icon: Icon }) => (
        <TabItem
          key={key}
          type="button"
          $active={activeTab === key}
          onClick={() => handleChangeTab(key)}
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
