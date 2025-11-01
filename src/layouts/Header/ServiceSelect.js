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

const { Option } = Select;
function ServiceSelect({ serviceId, setServiceId }) {

  const SEARCH_TYPE = [
    { name: 'Cơ hội', 'link': '/sale/co-hoi' },
    { name: 'Đơn hàng', 'link': '/sale/order' },
    { name: 'Sản phẩm', 'link': '/sale/co-hoi' },
    { name: 'Khách hàng', 'link': '/product' },
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
    >
      {SEARCH_TYPE?.map((item, idx) => (
        <Option key={String(idx)} value={item?.id}>
          {item?.name}
        </Option>
      ))}
    </Select>
  );
}

export default ServiceSelect;
