/**************************************************************************/
/*  index.js                                                              */
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

import { Badge, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import useCollapseSidebar from '@flast-erp/core/hooks/useCollapseSidebar';
import SearchInput from './SearchInput';
import ServiceSelect from './ServiceSelect';
import HeaderWrapper from './styles';
import CustomButton from '@flast-erp/core/components/CustomButton';
import { BellFilled, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import UserInfo from './UserInfo';
import useServiceId from '@flast-erp/core/hooks/useServiceId';
import { useNavigate } from "react-router-dom";

const Header = () => {

  const { t, i18n } = useTranslation();
  const { isCollapseSidebar, toggleCollapse } = useCollapseSidebar();
  const { serviceId, setServiceId } = useServiceId();
  let navigate = useNavigate();

  const isVietnamese = String(i18n.language || 'vi').toLowerCase().startsWith('vi');

  const toggleLanguage = useCallback(() => {
    const next = isVietnamese ? 'en' : 'vi';
    i18n.changeLanguage(next);
    moment.locale(next);
    localStorage.setItem('locale', next);
  }, [i18n, isVietnamese]);

  return (
    <HeaderWrapper className="header">
      <div className="leftHeader">
        <UnorderedListOutlined
          className={`trigger ${isCollapseSidebar ? '' : 'reverse-trigger'}`}
          onClick={toggleCollapse}
        />
        <div>
          <ServiceSelect serviceId={serviceId} setServiceId={setServiceId} />
        </div>
        <div className="div-search-customer">
          <SearchInput serviceId={serviceId} setServiceId={setServiceId} />
        </div>
      </div>
      <div className="rightHeader">
        <CustomButton
          title="button.fastBooking"
          onClick={() => navigate("/sale/ban-hang")}
          icon={<PlusOutlined />}
          type='primary'
        />
        <Link to="/notifications" className="link-noti">
          <Badge count={0}>
            <BellFilled className="icon-noti" />
          </Badge>
        </Link>
        <Tooltip title={isVietnamese ? t('header.languageToggleToEn') : t('header.languageToggleToVi')}>
          <button
            type="button"
            className="header-language-toggle"
            onClick={toggleLanguage}
            aria-label={isVietnamese ? t('header.languageToggleToEn') : t('header.languageToggleToVi')}
          >
            {/* <TranslationOutlined className="header-language-toggle__icon" /> */}
            <span className="header-language-toggle__badge">
              {isVietnamese ? t('header.languageCurrentVi') : t('header.languageCurrentEn')}
            </span>
          </button>
        </Tooltip>
        <UserInfo />
      </div>
    </HeaderWrapper>
  );
};

export default Header;
