# So sánh trang bán hàng gốc với bản hiện tại

**Cập nhật sau khôi phục:** các phần so sánh dưới đây ghi lại trạng thái trước
khi khôi phục generic. Host hiện đã dùng lại bán hàng gốc cùng modal SKU,
thanh toán, hóa đơn, chi tiết đơn và `GenericOrderService`. Remote Hatenko giữ
nguyên bản custom. Các adapter host đã được thêm cho drawer, props và in PDF;
không đưa logic công thức/tiền tệ Hatenko trở lại generic.

Đối chiếu bằng lịch sử Git local và source đang có trong working tree. Chỉ tạo
snapshot/báo cáo; không khôi phục hay sửa nghiệp vụ đang chạy.

## Mốc gốc

`b129a8b1396d9070c20b24c30507d9d20bc6e827`, ngày 25/06/2026, là mốc trước
commit đầu tiên của tác giả `duongtmfs` chạm vào module Order trong lịch sử đang xét.
`998083d` ngày 26/06 sửa `Order/List.js`. Với riêng editor bán hàng:

- `src/containers/Order/index.js`: thay đổi đầu tiên của tác giả là `00b2f0e`, 03/08/2026.
- Wrapper `src/pages/banhang/index.js`: thay đổi đầu tiên là `f8477a1`, 16/09/2026.
- `src/services/OrderService.js`: thay đổi đầu tiên là `ce8173f`, 24/08/2026.

Ba file này không khác giữa `b129a8b` và `6051145` (parent của `00b2f0e`). Vì vậy
mốc tháng 6 cũng chứa cùng bản editor trước lần sửa đầu tiên vào tháng 8.

Không có ref branch `duongtm` hiện tại trong checkout. Tên này xuất hiện trong PR
cũ; các commit bán hàng gần đây của `duongtmfs` được merge qua nhánh `minhduong`.
Không dùng tên branch hoặc tên commit để tự suy ra mỗi thay đổi thuộc tenant nào.
Theo phạm vi người dùng xác nhận, các custom nghiệp vụ này phục vụ Hatenko.

Snapshot gốc nằm trong [original/src](original/src), lịch sử ở [commits.txt](commits.txt),
diff trực tiếp ba file ở [comparison.diff](comparison.diff).

## UI và nghiệp vụ

| --- | --- | --- |
| Tiêu đề trang | Luôn “Tạo cơ hội bán hàng” | Phân biệt tạo/sửa cơ hội và sửa đơn hàng theo URL |
| Bảng sản phẩm | Mã SKU, diễn giải, bảo hành, số lượng, đơn giá, chiết khấu, thành tiền, kho, tồn, đơn vị | Thêm mã đơn con, tên sản phẩm, SKU, giá mua, lợi nhuận, giá bán, VAT, ngày dự kiến/chốt |
| Tiền tệ | Một đơn giá; không có selector currency trong editor | Chọn USD/VND, mặc định USD; VND ẩn các cột giá USD |
| Tính giá | Đơn giá nhập tay/giá SKU theo khoảng số lượng | Tách giá mua và giá bán, hỗ trợ công thức, lợi nhuận và phí vận chuyển |
| Công thức | Không có UI công thức hoặc API lấy cấu hình | Đọc `CACULATOR_TOTAL`, chọn/cấu hình công thức, áp dụng một lần, sau đó vẫn chỉnh tay |
| Thành tiền | `quantity × price` khi sửa quantity/price; tổng đơn trừ chiết khấu | Theo giá bán của currency; cộng VAT vào tổng; giữ tổng đã lưu khi chưa yêu cầu tính lại |
| Chiết khấu | Phần trăm tính trên `price × quantity` | Phần trăm sửa ở model tính theo giá mua của currency; giá trị được trừ khi tính tiền dòng |
| SKU/dòng đơn | `skuDetailCode`, `detailId`, `orderName`; thêm sản phẩm theo popup cũ | Chuẩn hóa `skuId`, `code`, `orderDetailCode`, SKU attributes, product code và orderLine |
| Đơn hiện có | Nạp data, bổ sung kho/tồn | Chuẩn hóa giá, tiền tệ, ngày, SKU, customer fallback và merge chi tiết sau lưu |
| Thông tin bổ sung | Customer và các dòng sản phẩm | Thêm doanh nghiệp, payment terms/percent, snapshot công thức trong payOptions |
| Lưu thành công | Reload editor với ID trả về | Có callback quay về màn trước qua `navigate(-1)`, cùng cơ chế cập nhật dòng đã lưu |
| Quyền chỉnh sửa | Sửa theo trạng thái editable của dòng | Thêm hideEditColumn/restrictOrderFields và khóa một số trường khi mở từ đơn hàng |

## Payload và API

Endpoint lưu vẫn là `POST /order/save`, nhưng payload đã thay đổi đáng kể.

Gốc: `{ customer, details: data, id?, dataId? }`, gửi nguyên các dòng đang giữ trong state.

Hiện tại: vẫn có customer/details/id/dataId nhưng thêm `currency`, `shippingCost`,
`vat`, `code`, enterprise metadata và `payOptions` khi cần. Mỗi dòng được chọn các
field để gửi; xử lý riêng price/priceV, chuẩn hóa dayQuote và skuDetails, USD bỏ
productPriceV/priceV trong phần tương ứng. Không còn gửi exchangeRate từ editor.

Endpoint xem/sửa vẫn là `GET /erp/order/view-on-edit`; service hiện tại có nhiều
logic chuẩn hóa response hơn bản gốc. Không thể kết luận restore toàn bộ source cũ
sẽ tương thích backend/core hiện tại chỉ dựa vào việc endpoint cùng tên.

## Tách remote hiện tại đã và chưa làm gì

Hiện route `/sale/ban-hang` chọn `SalesEditor` remote cho 1649; tenant khác chọn
page local của host. Tuy nhiên page local đó cũng là bản đã được custom.

Đã so sánh AST, bỏ import và comment, giữa host và remote cho tám file quan trọng:
wrapper page, editor UI, useOrderEditor, OrderItemsTable, orderPricing,
orderEditorPayload, orderFormula và OrderService. Cả tám có thân code nghiệp vụ
giống nhau. Khác biệt ở cách import, đường dẫn và bridge API/runtime.
Kết quả lưu tại [host-remote-comparison.json](host-remote-comparison.json).

Do đó **tenant khác chọn local chưa có nghĩa là được trả về bán hàng gốc**.
Trong lần tách remote trước, host và remote đã được tạo từ cùng bản custom.

## Hướng tách tiếp theo

Giữ UI/logic custom trong `apps/hatenko`. Với host, dùng snapshot gốc làm cơ sở
khôi phục hành vi bán hàng generic, đồng thời kiểm tra khả năng tương thích API,
core, SKU và quyền hiện tại. Những sửa lỗi tích hợp cần giữ chung phải được rà
từng phần; tránh revert nguyên commit vì nhiều commit sửa cả các module khác.

Trước khi merge cần kiểm tra ít nhất hai tenant: 1649 và một tenant khác, các luồng
tạo/sửa cơ hội, chuyển thành đơn hàng, chọn SKU, chiết khấu, tổng tiền, thanh toán
và payload thật gửi backend. Báo cáo này chưa thực hiện bước khôi phục host.
