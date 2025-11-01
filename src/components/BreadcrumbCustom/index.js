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

import { useTranslation } from 'react-i18next';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { BreadcrumbWrapper } from './styles';

const BreadcrumbCustom = ({ data }) => {
  const { t } = useTranslation();
  return (
    <BreadcrumbWrapper>
      <Breadcrumb separator=">">
        {
          data.map((data, index) => (
            <Breadcrumb.Item key={String(index)}>
              {data.path ? (
                <Link to={data.path}>
                  <span className="breadcrumb-item__name breadcrumb-item__link">
                    {t(data.title)}
                  </span>
                </Link>
              ) : (
                <span className="breadcrumb-item__name">
                  {data.title ? t(data.title) : t('error.waitingUpdate')}
                </span>
              )}
            </Breadcrumb.Item>
          ))
        }
      </Breadcrumb>
    </BreadcrumbWrapper>
  );
};

BreadcrumbCustom.propTypes = {};
export default BreadcrumbCustom;
