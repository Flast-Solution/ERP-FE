# API contract — Chứng từ động

FE dùng trực tiếp `/erp/template/fetch` cho cả danh sách template và modal **Chọn hạng mục chứng từ**. Không gọi API `document-template/category/fetch`.

## 1. Danh sách template và cấu hình field

`GET /api/erp/template/fetch`

```json
{
  "errorCode": 200,
  "message": "success",
  "success": true,
  "data": [
    {
      "description": "Template dùng cho đơn hàng",
      "createdDate": "2026-07-21 07:06:37",
      "createdBy": 2,
      "updatedDate": "2026-07-21 07:08:12",
      "updatedBy": 2,
      "bizId": 1645,
      "templateId": "1f184d2b-6e1e-6847-b1de-bbffe62811c4",
      "code": "TMPL001",
      "name": "Template mẫu cho đơn hàng",
      "version": "1.0.0",
      "fields": [
        {
          "group": "Đơn hàng",
          "label": "Mã đơn hàng",
          "path": "order.code",
          "dataType": "string"
        },
        {
          "group": "Khách hàng",
          "label": "Tên khách hàng",
          "path": "customer.name",
          "dataType": "string"
        },
        {
          "group": "Đơn hàng",
          "label": "Ngày tạo",
          "path": "order.createdAt",
          "dataType": "date"
        },
        {
          "group": "Đơn hàng",
          "label": "Tổng tiền",
          "path": "order.total",
          "dataType": "number"
        }
      ],
      "status": 1,
      "data": "{\"schemaVersion\":1,\"name\":\"Báo giá\",\"nodes\":[]}"
    }
  ]
}
```

Quy ước:

- `templateId` là định danh dùng để sửa/xóa/chọn template.
- `fields` là danh sách nguồn dữ liệu hiển thị trong editor.
- `dataType` hỗ trợ `string`, `number`, `date`, `boolean`.
- `data` là JSON string của layout editor. Nếu chưa thiết kế thì trả `null`.
- `status`: `1` là đang sử dụng, `0` là không sử dụng.
- Response luôn trả `data: []` khi không có template.

## 2. Nguồn hạng mục của editor

Khi mở editor, FE lấy toàn bộ hạng mục và field, không phân trang:

`GET /api/erp/template/all-entities`

API không nhận `page`, `limit` hoặc `offset` và trả trực tiếp một mảng field:

```json
[
  {
    "group": "Đơn hàng",
    "label": "ID đơn hàng",
    "path": "customerOrder.id",
    "dataType": "long"
  },
  {
    "group": "Đơn hàng - Chi tiết",
    "label": "Tên sản phẩm",
    "path": "customerOrder.details.productName",
    "dataType": "string"
  }
]
```

FE chuyển `long`, `integer` thành kiểu số; `datetime` thành ngày giờ. Các path `customerOrder.details.*` được gom thành nguồn bảng động `customerOrder.details`.

## 3. Lưu template

FE gọi `POST /api/erp/template/save-data` với payload:

```json
{
  "templateId": "1f184d2b-6e1e-6847-b1de-bbffe62811c4",
  "sourceTemplateId": null,
  "code": "TMPL001",
  "name": "Template mẫu cho đơn hàng",
  "version": "1.0.0",
  "fields": [
    {
      "group": "Đơn hàng",
      "label": "Mã đơn hàng",
      "path": "order.code",
      "dataType": "string"
    }
  ],
  "status": 1,
  "bizId": 1645,
  "documentType": "quotation",
  "data": "{\"schemaVersion\":1,\"name\":\"Template mẫu cho đơn hàng\",\"nodes\":[]}"
}
```

`documentType` dùng theo mapping nghiệp vụ:

- `quotation`: Chứng từ báo giá, dùng khi nhấn **Báo giá**.
- `invoice`: Chứng từ hoá đơn, dùng trong tab **Hoá đơn** của **Thông tin đơn hàng**.
- `goods_issue`: Chứng từ xuất hàng.

Hai màn hình chỉ chọn mẫu đang sử dụng đúng loại, không lấy mẫu loại kia làm dự phòng. FE đọc danh sách từ `/api/erp/template/fetch`; luồng báo giá vẫn dùng `/api/erp/template/invoice?id=...` để lấy dữ liệu đơn hàng. Phê duyệt báo giá giữ `type: "quote"`, không đổi theo `documentType` của mẫu.

Payload lưu mẫu dùng `quotation`, `invoice`, `goods_issue` viết thường. FE vẫn đọc loại viết hoa từ BE.

Tương thích dữ liệu cũ: bản ghi `invoice` mang đúng tên **Mẫu Báo giá** được nhận diện là `quotation`; bản ghi `QUOTATION` mang tên **Mẫu hoá đơn** được nhận diện là `invoice`. Các mẫu `invoice` khác vẫn là hoá đơn. Quy tắc này áp dụng khi chọn mẫu và mở editor; lần lưu tiếp theo trong editor sẽ dùng loại chuẩn viết thường. Không tự gửi yêu cầu sửa dữ liệu BE khi chỉ xem chứng từ.

`documentType` chỉ nằm ở cấp ngoài, cùng cấp với `templateId`. JSON string trong `data` không chứa `documentType`.

Khi chỉnh sửa, `templateId` là ID hiện tại và `sourceTemplateId = null`. Khi tạo từ hạng mục đã chọn, `templateId = null` và `sourceTemplateId` là ID được chọn trong modal. Response thành công cần trả bản ghi đã lưu trong `data`, tối thiểu có `data.templateId`.

## 4. Xóa template

`POST /api/erp/template/delete?id=1f184d2b-6e1e-6847-b1de-bbffe62811c4`

```json
{
  "errorCode": 200,
  "message": "Xóa template thành công",
  "success": true,
  "data": null
}
```

## 5. File PDF báo giá của đơn hàng

`GET /api/erp/generated-document/fetch?categoryCode=ORDER_QUOTATION&sourceType=ORDER&sourceId=34014`

```json
{
  "errorCode": 200,
  "message": "success",
  "success": true,
  "data": [
    {
      "id": "doc-8f813f",
      "categoryCode": "ORDER_QUOTATION",
      "sourceType": "ORDER",
      "sourceId": 34014,
      "templateId": "1f184d2b-6e1e-6847-b1de-bbffe62811c4",
      "version": "1.0.0",
      "fileName": "Bao-gia-OVGY1326FJM.pdf",
      "mimeType": "application/pdf",
      "fileSize": 245760,
      "viewUrl": "/api/erp/generated-document/doc-8f813f/view",
      "downloadUrl": "/api/erp/generated-document/doc-8f813f/download",
      "isDefault": true,
      "createdAt": "2026-07-21 09:30:00",
      "createdBy": 2
    }
  ]
}
```

`viewUrl` trả `Content-Type: application/pdf` và `Content-Disposition: inline`. `downloadUrl` trả `Content-Disposition: attachment`. Nếu chưa có PDF, BE trả `data: []`.

### Mẫu HTML + JSON

FE hỗ trợ `data.layout.mode = "html"`, `data.nodes = []` và `data.htmlTemplate` chứa HTML/CSS đã kiểm tra, cấu hình fields/repeats và dữ liệu minh họa tùy chọn. BE lưu nguyên object này như các mẫu hiện có; không cần endpoint mới. Chi tiết định dạng gói import, mapping SKU/nhập tay và giới hạn CSS tại [html-document-templates.md](./html-document-templates.md).
