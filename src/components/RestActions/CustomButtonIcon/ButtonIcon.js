/**************************************************************************/
/*  ButtonIcon.js                                                         */
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

import I18n from 'i18next';
import { Tooltip, Button } from 'antd';
import { SyncOutlined } from '@ant-design/icons';

const ButtonIcon = ({
  title = '',
  disabled,
  buttonProps,
  handleClick,
  icon = <SyncOutlined />
}) => {
  return (
    <div>
      <Tooltip title={I18n.t(title)}>
        <Button
          {...buttonProps}
          disabled={buttonProps?.disabled || disabled}
          icon={icon}
          onClick={handleClick}
        />
      </Tooltip>
    </div>
  );
};

export default ButtonIcon;
