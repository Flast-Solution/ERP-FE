/**************************************************************************/
/*  SkuView.js                                                            */
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

import { arrayEmpty, arrayNotEmpty, formatMoney } from "utils/dataUtils";
import { SKUContent } from "./styles";
import { Typography } from 'antd';
const { Text } = Typography;

const SkuView = ({ skus }) => {
  if (arrayEmpty(skus)) {
    return '(No Content)'
  }
  const numRecord = skus.length;
  return (
    <SKUContent>
      {skus.map((item, key) =>
        <div key={key}>
          {key < 2 &&
            <>
              <Typography.Paragraph>
                <Text strong>{item.name}, SKU({item.id})</Text>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <Text>{item.skuDetails?.map(d => `${d.name}: ${d.value}`).join(', ')}</Text>
              </Typography.Paragraph>
            </>
          }
        </div>
      )}
      <Text strong type={"success"}>
        {numRecord > 2 &&
          <span>...</span>
        }
      </Text>
    </SKUContent>
  )
}

export const ShowSkuDetail = ({ skuInfo, width = 0 }) => {
  if (!arrayNotEmpty(skuInfo)) {
    return <span />;
  }
  const maxLines = 2;
  const itemsToShow = skuInfo.slice(0, maxLines);
  return <>
    {itemsToShow.map((item, key) => (
      <SKUContent key={key}>
        <Typography.Paragraph>
          <Text
            ellipsis
            {...(width > 0 ? { style: { width } } : {})}
          >
            <strong>{item.text}: </strong>
            <span>{item.values?.map(d => d.text).join(', ')}</span>
          </Text>
        </Typography.Paragraph>
      </SKUContent>
    ))}
    {skuInfo.length > maxLines && <div>...</div>}
  </>
}

export const PriceView = ({ skus }) => {
  if (arrayEmpty(skus)) {
    return '(No Content)'
  }
  const numRecord = skus.length;
  return (
    <SKUContent>
      {skus.map((item, key) =>
        <div key={key}>
          <Typography.Paragraph>
            <Text>{item.skuPrices?.map(d => `SKU(${item.id}), SL: ${d.quantityFrom} - ${d.quantityTo}, đơn gía: ${formatMoney(d.price)}`).join(', ')}</Text>
          </Typography.Paragraph>
        </div>
      )}
      <Text strong type={"success"}>
        {numRecord > 2 &&
          <span>...</span>
        }
      </Text>
    </SKUContent>
  )
}

export default SkuView;