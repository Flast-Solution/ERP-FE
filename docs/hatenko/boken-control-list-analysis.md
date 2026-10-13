# Boken control list: đối chiếu workbook và dữ liệu hiện tại

Ngày phân tích: 12/10/2026. Nguồn: `/Users/macbook/Downloads/BOKEN_CONTROL_LIST__HATENKO (NEW) 12.08.2026.xlsx`, source ERP-FE và fs-hatenko, cùng response preview-list người dùng đã gửi trước đó. Chưa gọi backend trực tiếp; thông tin có sẵn dưới đây xác nhận ở contract/source và response mẫu, không khẳng định mọi bản ghi trên server đã điền đủ.

## Workbook

- `Control sheet`: 22 cột có tiêu đề A:V; 1.322 dòng test thực tế ở hàng 2:1323. Các hàng sau là vùng trống/định dạng. Có 101 mã đơn test (trim) và 102 số báo cáo (trim).
- Một dòng biểu diễn một phép test của một mẫu/LOT, không phải một đơn hàng hoặc một LOT hoàn chỉnh. Một mã đơn test gồm nhiều LOT, màu, phép test và có thể có nhiều báo cáo. `V0126011218` xuất hiện ở hai mã đơn test `47.26-HTK.BK` và `48.26-HTK.BK`; không dùng số báo cáo làm khóa duy nhất toàn danh sách.
- `Label`: theo dõi binder, mẫu có/thiếu và trạng thái nhập list. `Label!L4:L5` giải thích: “Chưa nhập list” vẫn có mẫu trong binder; “Thiếu mẫu” là không có mẫu trong binder.
- `TEST ITEMS`: danh mục nội dung/phương pháp test, có tiếng Anh/Nhật và nhiều biến thể phương pháp.
- `DATA_LISTS`: danh mục customer, end user, test supplier, tested sample, nội dung và tiêu chuẩn; supplier hiện có BOKEN, tested sample có Received/Not yet.
- `Sheet2` trống.
- Có 21 dòng test chưa điền LOT; có mã dạng TRIAL SAMPLE, TBD, X và mẫu thử. Không thiết kế khóa bắt buộc chỉ từ tên LOT hoặc chỉ từ lệnh sản xuất.
- Ô gộp ở các cột thông tin chung không có nghĩa các dòng con thiếu dữ liệu. Nếu nhập Excel, chỉ kế thừa giá trị trong phạm vi merged-cell, không fill-down mù sang nhóm tiếp theo.
- Kết quả là text: `C: 4`, `D: 4-5 / W3-4`, `WARP/FILLING`, `Original/After Washes`, giá trị số hoặc mô tả. Giữ nguyên text; không parse tất cả thành một số.
- QUOTATION có công thức/chiết khấu/phân bổ, phí hóa đơn gồm VAT và có thêm phí báo cáo/giặt trong ghi chú. Không mặc định invoice amount bằng tổng quotation.
- Cột ngày có cả date Excel và chuỗi; số hóa đơn cũng có ô bị định dạng thành date, ví dụ `S254`. Cần xác nhận dữ liệu trước khi nhập lịch sử; không tự sửa số hóa đơn dựa trên date hiển thị.

## Đối chiếu 22 cột

| Cột | Nội dung | Nguồn hiện tại / khoảng trống |
|---|---|---|
| A | STT | FE đánh số theo nhóm đơn test; không phải ID lưu |
| B | DATE REQUEST | Chưa có ngày gửi/đề nghị test riêng; không dùng submittedAt thay thế |
| C | TEST APPLICATION NO | Chưa có mã đơn test `*.HTK.BK`; khác mã đơn hàng và LSX |
| D | CUSTOMER | Có ngữ cảnh khách hàng đơn hàng từ order tracking; cần chốt đó có đúng CUSTOMER trong sheet không |
| E | END USER | Chưa thấy field Boken ổn định; không suy từ tên người nhận hàng |
| F | HTK ITEM | Product/SKU có mã, nhưng chưa xác nhận field mã nội bộ HTK riêng |
| G | FACTORY ITEM | Product/SKU và skuDetails có dữ liệu; cần mapping mã nhà máy riêng với HTK ITEM |
| H | Color | `nhap_lot.rows[].color`; ưu tiên màu của LOT, dự phòng thuộc tính SKU sau khi chốt mapping |
| I | LOT NO | `rows[].code_lot` ở component hiện tại hoặc `rows[].code` ở response workflow cũ |
| J | TEST CONTENT | `tests.thirdParty[].name` hoặc `tests.thirdParty.rows[].name` |
| K | TEST STANDARD | `standard` của dòng test; sheet ghi phương pháp JIS/ISO, cần phân biệt phương pháp test với ngưỡng đạt như ≤5% |
| L | TEST RESULT | `results[lot.id]` của dòng Third party; giữ nguyên chuỗi kết quả |
| M | QUOTATION | Chưa có giá báo test theo dòng test/mẫu; khác báo giá bán hàng ERP |
| N | TEST SUPPLIER | Hiện chỉ có nguồn Third party, chưa có labId/labName nên chưa lọc chính xác BOKEN |
| O | DATE RESULT | Chưa có ngày nhận báo cáo/kết quả; khác ngày nhận mẫu và ngày submit workflow |
| P | REPORT NUMBER | Chưa có reportId/reportNo gắn test và LOT |
| Q | SAMPLE STORED IN BINDER OR NOT | Chưa có binderId/binderNo và cờ có mẫu trong binder; không dùng `sample` hoặc `htkConfirmed` thay |
| R | INVOICE DATE | Chưa có hóa đơn phí phòng test |
| S | INVOICE NO | Chưa có số hóa đơn phí phòng test |
| T | INVOICE AMOUNT (VAT included) | Chưa có số tiền phí test/VAT/currency ở ngữ cảnh lab |
| U | TESTED SAMPLE | Chưa có trạng thái nhận lại mẫu sau test; khác nhận mẫu sản xuất ban đầu |
| V | NOTE | Có thể thêm cột động cho LOT, nhưng chưa có ghi chú riêng cho đơn test/báo cáo/phí test |

## Các API hiện có và luồng đọc kết quả

1. `POST /api/erp/order-tracking/search`: lấy `data.content[].order`, `orderDetails`, `manufactureProducts` để dựng ngữ cảnh đơn to, đơn con/SKU và LSX. API này phân trang đơn hàng, chưa phải API phân trang dòng kết quả test.
2. `POST /api/workflow/process/instance/get-entity` với `{ "entityName": "PRODUCTION", "entityIds": [<orderDetailId>] }`: workflow sản xuất hiện gắn với đơn con. Một đơn con có thể tham gia nhiều LSX; dùng `productionDetailKey` để nhận diện chi tiết lệnh, không giả định workflow entityId là manufactureProduct.id.
3. `POST /api/workflow/process/preview-list` với `[<instanceId>, ...]`: trả preview của các instance, chứa `submissions[].valuesJson` và version/step. Trong một step lấy version mới nhất; không cộng cả lịch sử submit.
4. Parse `valuesJson` nếu là JSON string; đọc `nhap_lot`, giữ nguyên table gồm rows, tests, excluded.
5. Chuẩn hóa hai thế hệ schema, rồi lấy LOT `lotTest === true`, loại LOT bị excluded ở nguồn Third party. Với mỗi dòng test và LOT trong phạm vi, lấy `results[lot.id]` để tạo một dòng control list. Dòng thiếu kết quả nên hiện trạng thái chưa có kết quả, không thay thành 0.
6. Join ngữ cảnh bằng ID: orderDetailId, instanceId, LOT row.id, test row.id và productionDetailKey. Không join tên test, mã LOT hoặc productId đơn lẻ. Dùng source/step/report/attempt trong khóa khi có nhiều lần test.
7. Chỉ lọc BOKEN khi có metadata nơi test; hiện không thể phân biệt BOKEN và một lab khác từ tên nguồn Third party.

`GET /api/erp/manufacture/fetch` bổ sung dữ liệu lệnh sản xuất. `POST /api/erp/manufacture/save` lưu lệnh/achieved, không phải nơi lưu hồ sơ test.

`GET /api/erp/warehouse-paracel/find-entity` là dữ liệu kiện/LOT kho và `WAREHOUSE_PARCEL` workflow tương ứng; không thay cho submission của PRODUCTION đang lưu bảng nhập LOT và test.

`GET /api/erp/template/invoice` và các invoice-check/template endpoints hiện dùng chứng từ đơn bán; chưa có liên kết chứng minh chúng chứa hóa đơn phí test do BOKEN xuất. Không tái sử dụng Commercial Invoice thành hóa đơn lab chỉ vì cùng tên invoice.

## Khác biệt schema cần xử lý

Response đã gửi trước đây:

```text
nhap_lot.rows[].code / quantity / sampleReceivedAt
nhap_lot.tests.thirdParty.rows[]
nhap_lot.tests.thirdParty.excludedLotIds
nhap_lot.tests.thirdParty.rows[].houseRowId
```

Component trong fs-hatenko hiện tại:

```text
nhap_lot.rows[].code_lot / so_luong / sampleReceivedDate
nhap_lot.tests.thirdParty[]
nhap_lot.tests.excluded.thirdParty[]
nhap_lot.tests.thirdParty[].houseId
```

`normalizeLotTable()` hiện chưa xử lý đầy đủ schema cũ dạng `{rows, excludedLotIds}` và các alias `code/quantity`. `buildLotDetailRows()` hiện lấy `lot.code/quantity`, có giữ `_lotTable`, nhưng cần fallback `code_lot/so_luong` và chuẩn hóa tests trước khi dựng Boken. Phải thêm adapter và kiểm tra bằng cả hai mẫu, không sửa/xóa dữ liệu lịch sử để phù hợp một phiên bản UI.

Không gọi lại preview cho từng LOT: batch theo instance và tái sử dụng cache cùng phiên/doanh nghiệp. Với tab toàn doanh nghiệp, cần API tổng hợp phân trang theo dòng test, nếu không FE phải quét tất cả đơn hàng/workflow mới biết tổng số dòng và bộ lọc chính xác.

## Metadata cần bổ sung

Tối thiểu để tổng hợp đúng BOKEN:

- labId/labName hoặc supplierId phân biệt nơi test, áp dụng theo đợt test/báo cáo.
- testApplicationId/testApplicationNo, requestDate.
- reportId/reportNo, resultReceivedDate; quan hệ báo cáo ↔ LOT/test cần rõ.
- testAttemptId/attemptNo cho test lại. Không ghi đè mất kết quả lần trước bằng sửa cùng map results.
- methodCode/methodName và acceptanceCriteria nếu muốn phân biệt phương pháp với tiêu chí đạt. Không suy pass/fail từ trạng thái Khớp/Lệch: đó chỉ là so sánh House và Third party.

Để đủ workbook, bổ sung:

- customerId/endUserId hoặc tên được lưu cho mẫu thử; HTK item/factory item riêng.
- quotation amount/currency theo test hoặc report line; quy tắc phân bổ khi một test/phí bao phủ nhiều mẫu.
- hóa đơn lab: invoiceId/no/date, amount including VAT/currency; phí khác (report/washing), liên kết tới report/application. Lưu ở cấp hóa đơn, không nhân tổng khi có nhiều dòng test.
- binderNo và sampleStoredInBinder; testedSampleStatus/returnedSampleReceivedDate; tách khỏi mẫu sản xuất ban đầu.
- notes, attachments báo cáo nếu cần mở PDF, quyền sửa.
- loại mẫu PRODUCTION/TRIAL và reference tùy chọn, để quản lý mẫu không có orderId/LOT sản xuất.

Các cột động hiện có có thể chứa một số thông tin nhưng key tạo ngẫu nhiên `column_*`, chưa phải contract ổn định giữa form và tab tổng hợp. Cần field keys cố định hoặc cấu hình mapping theo template/version.

## Hướng triển khai đề xuất

### Giai đoạn kết quả test

Trong fs-hatenko, thêm tab đọc dữ liệu hiện có theo phạm vi đã chọn: LOT, màu, sản phẩm, nội dung/phương pháp, kết quả, nguồn và LSX. Adapter dùng cả hai schema. Bổ sung metadata lab/application/report trước khi gọi đây là danh sách BOKEN hoàn chỉnh. Các trường chưa có để trống và ghi rõ, không tạo từ ngày submit hoặc mã LSX.

### Giai đoạn hồ sơ đầy đủ

Tạo model Test Application → sample references/test attempts/report lines, và quan hệ nhiều-nhiều application/report nếu cần theo workbook. Hóa đơn, binder và nhận lại mẫu có metadata riêng. Có thể tiếp tục dùng workflow để nhập dữ liệu, nhưng cần schema cố định/version và API tổng hợp phục vụ lọc/phân trang/xuất Excel toàn doanh nghiệp.

Nếu mở toàn doanh nghiệp, đề xuất BE cung cấp API mới cho Boken control list, trả từng dòng test với source IDs và metadata đã join. Đây là đề xuất, chưa phải endpoint đã có. Nếu chỉ mở trong một đơn hàng/LSX, API instance/get-entity + preview-list hiện tại đủ đọc kết quả nhưng chưa đủ toàn bộ cột workbook.

## Các điểm cần chốt

1. Tab chỉ BOKEN hay tất cả Third party có bộ lọc lab? Vị trí tab/phạm vi một đơn hay toàn doanh nghiệp?
2. Có quản lý mẫu thử ngoài đơn/LSX và các cột phí, hóa đơn, binder đầy đủ không?
3. CUSTOMER và END USER mapping field nào; HTK ITEM và FACTORY ITEM mapping mã nào?
4. Mã application/report sinh tự động hay nhập tay? Test lại tạo đợt mới hay thay kết quả cũ?
5. Hóa đơn gộp nhiều report/application thế nào, và quotation là giá mỗi phép test, mỗi mẫu hay giá gói?
