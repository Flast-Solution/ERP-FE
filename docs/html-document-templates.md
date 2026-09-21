# Mẫu chứng từ HTML + JSON (version 1)

## Cách dùng

1. Vào **Tạo chứng từ**, mở trình thiết kế và bấm **Tải mẫu HTML HTK**.
2. Giải nén, sửa `template.html` và `fields.json` bên ngoài (VS Code hoặc công cụ xuất HTML theo quy chuẩn dưới đây).
3. Nén **nội dung thư mục** thành ZIP: `template.html` và `fields.json` phải ở ngay thư mục gốc, không bọc thêm thư mục.
4. Bấm **Import HTML + JSON**, chọn ZIP và xác nhận thay thế bố cục. Có thể Hoàn tác.
5. Chọn trường trên trang hoặc danh sách bên trái. Chọn Nhập tay, Dữ liệu đơn hàng, Thuộc tính SKU, Nội dung cố định hoặc Tổng một trường số.
6. Bấm **Lưu chứng từ**. **Xuất gói HTML** tải lại layout và cấu hình đã sửa để dùng ở môi trường khác.

Mẫu HTK thuộc loại `invoice`. Đổi thành `quotation` trong editor nếu dùng làm báo giá. Cơ chế quyền sửa/phê duyệt báo giá cũ vẫn áp dụng. Tab hóa đơn chỉ xem/in, không mở thêm quyền sửa đơn hàng.

## Cấu trúc ZIP

```text
template.html
fields.json
sample-data.json       # không bắt buộc; chỉ dành cho designer / xem trước mẫu
assets/logo.png
assets/MyFont.woff2     # không bắt buộc
```

Giới hạn: ZIP và tổng nội dung giải nén tối đa 20 MB; tối đa 100 tệp, 5.000 phần tử HTML, 300 trường. Chỉ hỗ trợ một mẫu trong mỗi gói. Không chấp nhận đường dẫn tuyệt đối hay `..`.

## HTML

```html
<style>
.document { padding: 20px; font-family: Arial; }
.items { width: 100%; border-collapse: collapse; }
.items td { border: 1px solid #000; padding: 4px; }
</style>
<div class="document">
  Khách hàng: <span data-field="buyer"></span>
  <table class="items"><tbody>
    <tr data-repeat="products">
      <td><span data-field="productName"></span></td>
      <td>Composition: <span data-field="composition"></span></td>
      <td><span data-field="note"></span></td>
    </tr>
  </tbody></table>
</div>
```

Mã `data-field` là duy nhất trong HTML nguồn (dù vùng lặp sẽ tạo nhiều bản khi hiển thị). Không lồng trường trong trường, không lồng vùng lặp. Nội dung bên trong phần tử `data-field` được thay bằng dữ liệu dạng text; HTML xung quanh được giữ nguyên. Không thực thi JavaScript hay biểu thức từ template.

## fields.json

```json
{
  "version": 1,
  "name": "Mẫu hóa đơn",
  "documentType": "invoice",
  "orientation": "portrait",
  "repeats": {
    "products": { "source": "customerOrder.details" }
  },
  "fields": {
    "buyer": {
      "label": "Khách hàng", "mode": "binding", "path": "customer.name"
    },
    "productName": {
      "label": "Sản phẩm", "mode": "binding", "path": "productName"
    },
    "composition": {
      "label": "Thành phần", "mode": "sku", "attribute": "Thành phần",
      "allowedModes": ["sku", "manual", "binding"]
    },
    "note": {
      "label": "Ghi chú", "mode": "manual", "value": ""
    }
  }
}
```

- `binding`: `path` tuyệt đối bên ngoài vùng lặp; tương đối với từng sản phẩm bên trong vùng lặp.
- `sku`: tìm `skuDetails[].text` theo `attribute`, đọc `values[].text`. Bên ngoài vùng lặp cần `source` (mặc định `customerOrder.details`) và `rowIndex` (từ 0). Trong vùng lặp tự lấy dòng hiện tại. Chưa chọn thuộc tính thì hiển thị trống.
- `manual`: người có quyền sửa báo giá nhập trực tiếp; `value` là mặc định do người thiết kế chủ động đặt. Giá trị đã lưu, kể cả chuỗi rỗng, có ưu tiên cao hơn mặc định.
- `static`: hiển thị `value` cố định.
- `sum`: tổng các giá trị số ở `path` trong danh sách `source`, ví dụ `source: "customerOrder.details", path: "total"`. Không chạy công thức JavaScript. VAT/tổng sau thuế cần binding vào dữ liệu BE nếu khác mẫu VAT 0%.
- `allowedModes`: giới hạn lựa chọn cấu hình trong editor, **không phải cơ chế phân quyền**.
- `format`: `text`, `number`, `currency` (VND), `date`, `number_en` (4,867), `decimal_en` (8,906.61).
- `documentType`: `invoice`, `quotation`, `goods_issue`; khổ giấy A4, `portrait` hoặc `landscape`.

## Layout, CSS, ảnh và font

- Giữ cấu trúc HTML/CSS, không chuyển thành các node kéo thả. Khi cần sửa layout, sửa gói bên ngoài và import lại.
- Ưu tiên `table`/`colgroup`, chiều rộng cột rõ ràng; `thead` cho tiêu đề lặp khi in. Grid và flex cơ bản cũng được hỗ trợ.
- CSS đặt trong `<style>` hoặc inline. Dùng wrapper `.document`, không dùng selector `html`, `body`, `:root`. CSS được giới hạn theo từng bản xem để không tác động giao diện ERP.
- Hỗ trợ `@media print` và `@font-face`. Cấu hình khổ giấy trong JSON, không dùng `@page`.
- Font nhúng đặt tên đơn như `InvoiceFont`, không chứa khoảng trắng. Tên font được đổi riêng cho mỗi bản xem để tránh ảnh hưởng font của mẫu khác.
- Ảnh PNG/JPEG/WebP/GIF và font WOFF/WOFF2/TTF/OTF lấy từ `assets/` hoặc data URL base64. Sau import được nhúng vào dữ liệu lưu, không phụ thuộc localhost hay upload URL. Không hỗ trợ SVG trong phiên bản này.
- Chặn URL ngoài, `@import`, iframe, script, event handler, CSS variables/hàm chưa được hỗ trợ và `position: fixed/sticky`. CSS ngoài danh sách hỗ trợ sẽ báo lỗi thay vì bỏ qua làm sai layout.
- Không cam kết giữ mọi HTML xuất từ Word/Excel. Kiểm tra mẫu trong Xem trước và in thử trước khi kích hoạt.
- Bảng lặp tự giãn theo số sản phẩm. In bằng trình duyệt dùng phân trang CSS. Tải PDF báo giá tiếp tục dùng cơ chế chia ảnh theo hàng hiện có; không tự thêm đầu bảng ở mỗi trang ảnh. Dòng cao hơn một trang có thể phải cắt. Không dùng ô gộp dọc nối qua các dòng lặp.

## Lưu và mở lại

API lưu vẫn dùng `/erp/template/save-data`; `documentType` ở cấp record, `data` là JSON string:

```json
{
  "schemaVersion": 3,
  "name": "Mẫu HTML",
  "layout": { "mode": "html" },
  "nodes": [],
  "htmlTemplate": {
    "version": 1,
    "html": "...",
    "css": "...",
    "fields": {},
    "repeats": {},
    "sampleData": {}
  }
}
```

Không yêu cầu endpoint mới; BE cần giữ nguyên object trong `data`. FE hỗ trợ response dạng object hoặc mảng một phần tử, cũng như JSON string của hai dạng này.

Ô nhập tay dùng namespace ổn định theo mã field:

- Cấp đơn hàng: `quoteConfig.manualValues["customerOrder.htmlFields.contract"]`.
- Trong `customerOrder.details`: `details[i].quoteConfig.manualValues["htmlFields.shippingMarks"]`, ghép lại theo ID detail khi lưu.
- Vùng lặp từ nguồn khác: lưu cấp đơn hàng theo chỉ số dòng; nếu cần chống thay đổi thứ tự nên dùng nguồn `customerOrder.details`.

Không đổi mã field sau khi đã dùng nếu muốn giữ liên kết dữ liệu cũ. Sample data chỉ dùng trong designer/preview mẫu, không tự trộn vào đơn hàng hoặc payload lưu báo giá.

## Mẫu HTK và kiểm thử

Nguồn mẫu: `examples/document-templates/htk-commercial-invoice/`.
Tạo lại ZIP sau khi sửa nguồn:

```sh
node scripts/build-document-template-example.cjs
```

ZIP phát hành: `public/document-templates/htk-commercial-invoice.zip`.

Mẫu HTK giữ thông tin người bán từ PDF tham chiếu. Các dữ liệu người mua, ngày, giao hàng, sản phẩm là dữ liệu minh họa hoặc binding. Đơn giá được hiển thị ở từng dòng; dòng tổng không cộng đơn giá. Thuế mẫu là VAT 0%; cần sửa binding/cấu hình nếu áp dụng thuế khác.
