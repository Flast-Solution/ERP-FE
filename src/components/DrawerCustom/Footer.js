
/**************************************************************************/
/*  Footer.js                                                             */
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

import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { FooterStyles } from './styles';

const Footer = ({
  onClose,
  onOk,
  okButtonProps,
  cancelButtonProps,
  okText = 'button.save',
}) => {
  const { t } = useTranslation();
  return (
    <FooterStyles className="footer-drawer">
      <Button
        onClick={onClose}
        className="footer-drawer-btn w-50 cancel-button"
        {...cancelButtonProps}
      >
        {t('button.cancel')}
      </Button>
      <Button
        onClick={onOk}
        className="footer-drawer-btn w-50"
        type="primary"
        {...okButtonProps}
      >
        {t(okText)}
      </Button>
    </FooterStyles>
  );
};

export default Footer;
