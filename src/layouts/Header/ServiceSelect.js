/**************************************************************************/
/*  ServiceSelect.js                                                      */
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

import { Select } from 'antd';
import i18next from 'i18next';

function ServiceSelect({ serviceId, setServiceId }) {

  const SEARCH_TYPE = [
    { label: 'Cơ hội', value: '0' },
    { label: 'Đơn hàng', value: '1' },
    { label: 'Sản phẩm', value: '2' },
    { label: 'Khách hàng', value: '3' },
  ];

  const onChangeLocation = (e) => {
    setServiceId(e);
  };

  return (
    <Select
      value={serviceId}
      style={{alignItems: 'center'}}
      className="border-none w-160 h-40"
      onChange={onChangeLocation}
      placeholder={i18next.t('services.all')}
      options={SEARCH_TYPE}
    />
  );
}

export default ServiceSelect;
