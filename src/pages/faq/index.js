/**************************************************************************/
/* pages.material.index.js                                                */
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
import { Helmet } from 'react-helmet';
import CustomBreadcrumb from '@/components/BreadcrumbCustom';
import Filter from '@/pages/faq/Filter';
import { f5List } from '@/utils/dataUtils';
import { HASH_MODAL } from '@/configs/constant';
import { InAppEvent } from '@/utils/FuseUtils';
import CustomList from '@/components/RestLayout/CustomList';
import {
  GridWrapper,
  TitleWrapper,
  Title,
  NoteIcon,
  MetaInfo,
  Description
} from '@/css/cardStyle';
import { Tooltip } from 'antd';

const TITLE = 'Danh sách các FAQ của trang.';
const FaqPage = () => {

  const onEdit = (faq) => {
    const onAfterSubmit = (values) => {
      f5List("faq/fetch");
    };
    InAppEvent.emit(HASH_MODAL, {
      hash: "faq.add",
      title: "Cập nhật FAQ #" + (faq.name || ''),
      data: { onSave: onAfterSubmit, faq }
    });
  };

  return (
    <div>
      <Helmet>
        <title>{TITLE}</title>
      </Helmet>
      <CustomBreadcrumb
        data={[{ title: 'Trang chủ' }, { title: TITLE }]}
      />
      <CustomList
        filter={<Filter />}
        hasCreate={true}
        onClickCreate={() => onEdit({})}
        apiPath={'faq/fetch'}
        renderItem={(item) => <FaqCard item={item} onEdit={onEdit} /> }
      />
    </div>
  )
};

const FaqCard = ({ item, onEdit }) => {
  return (
    <GridWrapper>
      <TitleWrapper>
        <Title ellipsis={{ tooltip: 'Sửa KPI' }}>
          {item.name}
        </Title>
        <Tooltip title="Sửa FaQ">
          <NoteIcon onClick={() => onEdit(item)} />
        </Tooltip>
      </TitleWrapper>
      <MetaInfo style={{marginBottom: 10}}>
        <Description 
          ellipsis={{
            rows: 3
          }}
        >
          {item.content}
        </Description>
      </MetaInfo>
    </GridWrapper>
  )
};

export default FaqPage;
