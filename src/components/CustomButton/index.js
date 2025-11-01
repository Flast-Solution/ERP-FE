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

import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { CustomButtonStyles } from './styles';

const CustomButton = ({
  title = "Hoàn thành",
  color = "danger",
  variant = "solid",
  inRigth = true,
  style,
  ...props
}) => {
  const { t } = useTranslation();
  return (
    <CustomButtonStyles
      className="custom-button"
      style={{
        display: 'flex',
        ...(inRigth ? { justifyContent: 'end' } : {}),
        ...(style ? style : {})
      }}
    >
      <Button
        color={color}
        variant={variant}
        {...props}
      >
        {t(title)}
      </Button>
    </CustomButtonStyles>
  )
};

export default CustomButton;
