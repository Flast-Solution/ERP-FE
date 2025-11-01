/**************************************************************************/
/*  Impersonation.js                                                      */
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
import i18next from 'i18next';
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons';
import { ImpersonationStyles } from './styles';

function Impersonation() {

  const [visibleText, setVisibleText] = useState(true);
  const onToggle = () => setVisibleText(!visibleText);

  return sessionStorage.getItem('sessionToken') ? (
    <ImpersonationStyles>
      {visibleText ? (
        <div>
          <RightCircleOutlined onClick={onToggle} />

          <span className="impersonation-text">
            {i18next.t('button.loginBySupperAdmin')}
          </span>
        </div>
      ) : (
        <LeftCircleOutlined onClick={onToggle} />
      )}
    </ImpersonationStyles>
  ) : null;
}

export default Impersonation;
