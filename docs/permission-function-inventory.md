# Danh mục chức năng phục vụ phân quyền FE

> Cập nhật theo source ngày 11/09/2026.
>
> Tài liệu này là kết quả rà soát tĩnh route, sidebar, page, container, drawer/modal và các thao tác gọi API trong `ERP-FE`. Cột **Permission đề xuất** chưa phải quyền đã được triển khai; đây là mã ổn định để FE và BE thống nhất ở bước xây dựng ACL.

## 1. Quy ước

### Trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Chức năng đang có UI hoặc handler sử dụng được trong source |
| 🔒 | Hiện đang giới hạn bằng `ROLE_*` hoặc điều kiện nghiệp vụ |
| ⚠️ | Có code nhưng chưa hoàn chỉnh, bị ẩn hoặc chưa có API đầy đủ |
| 🌐 | Route công khai, không áp dụng quyền người dùng nội bộ |

### Action chuẩn

| Action | Ý nghĩa |
|---|---|
| `view` | Xem danh sách, chi tiết hoặc mở màn hình |
| `create` | Tạo mới |
| `update` | Chỉnh sửa dữ liệu |
| `delete` | Xóa dữ liệu |
| `approve` / `reject` | Duyệt / từ chối |
| `assign` | Phân công người xử lý |
| `export` / `print` | Xuất hoặc in dữ liệu |
| `manage` | Cấu hình nghiệp vụ có nhiều thao tác con |

Không dùng label tiếng Việt hoặc URL làm mã quyền. Ví dụ nên dùng `sales.opportunity.update`, không dùng `Sửa cơ hội` hoặc `/sale/ban-hang/:id`.

## 2. Dashboard và thông báo

**Route:** `/`, `/sale/report-common`, `/notifications`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Dashboard | Xem tổng quan hoạt động | ✅ | `dashboard.view` |
| Dashboard | Xem biểu đồ Lead | ✅ | `dashboard.lead.view` |
| Dashboard | Xem biểu đồ doanh thu | ✅ | `dashboard.revenue.view` |
| Dashboard | Xem biểu đồ bán hàng | ✅ | `dashboard.sales.view` |
| Thông báo | Xem tất cả thông báo | ✅ | `notification.view` |
| Thông báo | Lọc thông báo chưa đọc | ✅ | `notification.view` |
| Thông báo | Đánh dấu đã đọc | ✅ | `notification.mark_read` |

## 3. Dự án và công việc

**Route:** `/task`, `/task/calendar/:id`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Dự án | Xem, tìm kiếm và lọc danh sách dự án | ✅ | `project.view` |
| Dự án | Xem chi tiết dự án và lịch công việc | ✅ | `project.detail.view` |
| Dự án | Tạo dự án | ✅ | `project.create` |
| Dự án | Chỉnh sửa dự án | ✅ | `project.update` |
| Dự án | Xóa dự án | ✅ | `project.delete` |
| Dự án | Cập nhật phần trăm tiến độ | ✅ | `project.progress.update` |
| Công việc | Xem lịch công việc theo tháng/tuần/ngày/danh sách | ✅ | `project.task.view` |
| Công việc | Tạo công việc trong dự án | ✅ | `project.task.create` |
| Công việc | Chỉnh sửa công việc | ✅ | `project.task.update` |
| Công việc | Xóa công việc | ✅ | `project.task.delete` |

## 4. Lead và Bot dữ liệu

**Route:** `/lead/*`, `/bot`

Các view thực tế trong wildcard Lead gồm `/lead`, `/lead/three-day` và `/lead/report`.

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Lead | Xem, tìm kiếm và lọc danh sách Lead | ✅ | `sales.lead.view` |
| Lead | Xem chi tiết Lead | ✅ | `sales.lead.detail.view` |
| Lead | Tạo Lead | ✅ | `sales.lead.create` |
| Lead | Chỉnh sửa Lead | ✅ | `sales.lead.update` |
| Lead | Chuyển Lead cho sale khác | ✅ | `sales.lead.assign` |
| Lead | Tạo cơ hội từ Lead | ✅ | `sales.lead.convert_opportunity` |
| Lead | Xem tiến trình workflow | ✅ | `sales.lead.workflow.view` |
| Lead | Chuyển trạng thái đàm phán/chăm sóc/mất đơn | ✅ | `sales.lead.stage.update` |
| Lead 3 ngày | Xem Lead chưa ra cơ hội sau 3 ngày | ✅ | `sales.lead.overdue.view` |
| Lead 3 ngày | Cập nhật kết quả chăm sóc | ✅ | `sales.lead.overdue.update` |
| Báo cáo Lead | Xem funnel, kênh, hiệu suất nhân viên, tốc độ chốt và lý do mất | ✅ | `sales.lead.report.view` |
| Bot dữ liệu | Xem và lọc dữ liệu Lead lạnh | ✅ | `sales.lead.cold.view` |
| Bot dữ liệu | Nhập thêm dữ liệu Lead lạnh | ✅ | `sales.lead.cold.create` |
| Bot dữ liệu | Chỉnh sửa dữ liệu Lead lạnh | ✅ | `sales.lead.cold.update` |
| Bot dữ liệu | Tạo cơ hội từ dữ liệu lạnh | ✅ | `sales.lead.cold.convert_opportunity` |
| Bot dữ liệu | Tải danh sách Excel | ✅ | `sales.lead.cold.export` |

## 5. Cơ hội bán hàng và báo giá

**Route:** `/sale/co-hoi/*`, `/sale/ban-hang`, `/sale/ban-hang/:orderId`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Cơ hội | Xem, tìm kiếm và lọc danh sách cơ hội | ✅ | `sales.opportunity.view` |
| Cơ hội | Xem chi tiết cơ hội | ✅ | `sales.opportunity.detail.view` |
| Cơ hội | Tạo cơ hội | ✅ | `sales.opportunity.create` |
| Cơ hội | Chỉnh sửa cơ hội | ✅ | `sales.opportunity.update` |
| Cơ hội | Thêm, sửa, xóa dòng sản phẩm | ✅ | `sales.opportunity.product.manage` |
| Cơ hội | Nhập thông tin bổ sung `orderLine` | ✅ | `sales.opportunity.product.update` |
| Cơ hội | Lưu cơ hội/đơn hàng | ✅ | `sales.opportunity.save` |
| Cơ hội 7 ngày | Xem cơ hội chưa ra đơn hàng sau 7 ngày | ✅ | `sales.opportunity.overdue.view` |
| Cơ hội 7 ngày | Cập nhật kết quả chăm sóc | ✅ | `sales.opportunity.overdue.update` |
| Workflow | Gắn hoặc gắn thêm workflow | ✅ | `sales.opportunity.workflow.attach` |
| Workflow | Xem và thao tác tiến trình workflow | ✅ | `sales.opportunity.workflow.view` |
| Báo giá | Mở và xem báo giá | ✅ | `sales.quotation.view` |
| Báo giá | Nhập tay dữ liệu trên mẫu | ✅ | `sales.quotation.update` |
| Báo giá | Chọn người phê duyệt | ✅ | `sales.quotation.assign_approver` |
| Báo giá | Lưu hoặc gửi duyệt | ✅ | `sales.quotation.submit` |
| Báo giá | Duyệt báo giá | 🔒 | `sales.quotation.approve` |
| Báo giá | Từ chối báo giá | 🔒 | `sales.quotation.reject` |
| Báo giá | In PDF | ✅ | `sales.quotation.print` |
| Báo giá | Tải PDF | ✅ | `sales.quotation.export` |

Quyền duyệt báo giá phải kết hợp với `userApproval` và trạng thái duyệt; permission riêng không thay thế điều kiện nghiệp vụ này.

## 6. Đơn hàng, hóa đơn và lô sản xuất

**Route:** `/sale/order/*`, `/sale/order/after-sale`, `/sale/order/cancelled`, `/sale/order-production`, `/sale/production/lots/create`, `/sale/order/progress`, `/sale/order/progress/:orderId`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Đơn hàng | Xem, tìm kiếm và lọc danh sách | ✅ | `sales.order.view` |
| Đơn hàng | Xem chi tiết: thanh toán, hóa đơn, công ty | ✅ | `sales.order.detail.view` |
| Đơn hàng | Xem đơn hủy | ✅ | `sales.order.cancelled.view` |
| Chăm sóc sau bán | Xem đơn hàng chưa chăm sóc | ✅ | `sales.order.after_sale.view` |
| Chăm sóc sau bán | Cập nhật kết quả chăm sóc | ✅ | `sales.order.after_sale.update` |
| Workflow | Gắn workflow vào đơn hàng hoặc chi tiết đơn | ✅ | `sales.order.workflow.attach` |
| Workflow | Xem tiến trình | ✅ | `sales.order.workflow.view` |
| Workflow | Thực hiện transition và gửi form ở từng bước | ✅ | `sales.order.workflow.execute` |
| Thanh toán | Xem lịch sử và tổng hợp thanh toán | ✅ | `sales.order.payment.view` |
| Thanh toán | Nhập VAT và phí vận chuyển | ✅ | `sales.order.payment.update_fee` |
| Thanh toán | Ghi nhận thanh toán thủ công | ✅ | `sales.order.payment.create` |
| Hóa đơn | Xem và chọn mẫu hóa đơn | ✅ | `sales.invoice.view` |
| Hóa đơn | Nhập tay dữ liệu và import sheet | ✅ | `sales.invoice.update` |
| Hóa đơn | Lưu hóa đơn | ✅ | `sales.invoice.save` |
| Hóa đơn | Duyệt hóa đơn | 🔒 | `sales.invoice.approve` |
| Hóa đơn | Từ chối hóa đơn | 🔒 | `sales.invoice.reject` |
| Hóa đơn | In PDF | ✅ | `sales.invoice.print` |
| Hóa đơn | Tải PDF | ✅ | `sales.invoice.export` |
| Thông tin công ty | Xem và cập nhật thông tin doanh nghiệp theo đơn | ✅ | `sales.order.company.update` |
| Hợp đồng | Tải lên và xóa file hợp đồng | ✅ | `sales.order.contract.manage` |
| Lô sản xuất | Xem danh sách lô của đơn | ✅ | `sales.order.lot.view` |
| Lô sản xuất | Tạo lô | ✅ | `sales.order.lot.create` |
| Lô sản xuất | Chỉnh sửa lô | ✅ | `sales.order.lot.update` |
| Lô sản xuất | Gắn workflow cho lô | ✅ | `sales.order.lot.workflow.attach` |
| Lô sản xuất | Xem tiến trình và kết quả kiểm tra | ✅ | `sales.order.lot.workflow.view` |

## 7. Quy trình nghiệp vụ và Form Builder

**Route:** `/workflow-designer`, `/workflow-forms`, `/workflow-form`, `/workflow-form/*`, `/workflow-form/:id`, `/sale/drag-drop-order`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Workflow | Xem và lọc danh sách workflow | ✅ | `workflow.process.view` |
| Workflow | Tạo workflow | ✅ | `workflow.process.create` |
| Workflow | Chỉnh sửa và lưu flow | ✅ | `workflow.process.update` |
| Workflow | Thêm, sửa, xóa bước và transition | ✅ | `workflow.process.design` |
| Workflow | Cấu hình action khi vào/rời bước | ✅ | `workflow.action.manage` |
| Workflow | Cấu hình guard/điều kiện chuyển bước | ✅ | `workflow.guard.manage` |
| Workflow | Cấu hình role được phép transition | ✅ | `workflow.transition_role.manage` |
| Workflow | Gắn form vào bước | ✅ | `workflow.form.attach` |
| Workflow | Cấu hình loại bước | ✅ | `workflow.step_type.manage` |
| Workflow | Cấu hình trạng thái theo loại nghiệp vụ | ✅ | `workflow.status.manage` |
| Form Builder | Xem danh sách form | ✅ | `workflow.form.view` |
| Form Builder | Tạo form | ✅ | `workflow.form.create` |
| Form Builder | Chỉnh sửa, kéo thả và cấu hình field | ✅ | `workflow.form.update` |
| Form Builder | Xóa field | ✅ | `workflow.form.update` |
| Form Builder | Xem trước UI/JSX | ✅ | `workflow.form.preview` |
| Form Builder | Dùng AI hỗ trợ thiết kế form | ✅ | `workflow.form.ai` |
| Dữ liệu form | Xem và lọc dữ liệu submission | ✅ | `workflow.submission.view` |
| Dữ liệu form | Thêm hoặc sửa dữ liệu submission | ✅ | `workflow.submission.create` |
| Kanban đơn hàng | Xem và tìm kiếm đơn theo trạng thái | ✅ | `workflow.order_board.view` |
| Kanban đơn hàng | Kéo thả cập nhật trạng thái | ✅ | `workflow.order_board.move` |
| Kanban đơn hàng | Mở cấu hình trạng thái quy trình | ✅ | `workflow.order_board.configure` |

## 8. Kế toán

**Route:** `/ke-toan/cong-no`, `/ke-toan/confirm`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Công nợ | Xem và lọc đơn chưa thanh toán đủ | ✅ | `accounting.receivable.view` |
| Công nợ | Xem chi tiết đơn, thanh toán và hóa đơn | ✅ | `accounting.receivable.detail.view` |
| Duyệt tiền | Xem danh sách lệnh thanh toán | ✅ | `accounting.payment_approval.view` |
| Duyệt tiền | Mở chi tiết lệnh thanh toán | ✅ | `accounting.payment_approval.detail.view` |
| Duyệt tiền | Duyệt lệnh thanh toán | ⚠️ | `accounting.payment_approval.approve` |

Màn `Duyệt tiền` có nút “Duyệt lệnh” nhưng phần container chi tiết hiện chủ yếu hiển thị bảng trạng thái; cần xác nhận API mutation duyệt trước khi coi đây là quyền hoàn chỉnh.

## 9. Khách hàng

**Route:** `/sale/m-customer`, `/customer/:id`, `/customer/enterprise`, `/customer/enterprise/:id`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Khách lẻ | Xem và lọc danh sách khách hàng | ✅ | `customer.retail.view` |
| Khách lẻ | Xem hồ sơ khách hàng | ✅ | `customer.retail.detail.view` |
| Khách lẻ | Tạo/chỉnh sửa thông tin khách hàng | ✅ | `customer.retail.update` |
| Khách lẻ | Quản lý tag | ✅ | `customer.retail.tag.manage` |
| Khách lẻ | Quản lý địa chỉ và địa chỉ mặc định | ✅ | `customer.retail.address.manage` |
| Khách lẻ | Xem nhật ký chăm sóc | ✅ | `customer.retail.care.view` |
| Khách lẻ | Tạo cơ hội từ hồ sơ khách hàng | ✅ | `customer.retail.convert_opportunity` |
| Doanh nghiệp | Xem và lọc danh sách doanh nghiệp | ✅ | `customer.enterprise.view` |
| Doanh nghiệp | Xem hồ sơ, doanh số, cơ hội và đơn gần đây | ✅ | `customer.enterprise.detail.view` |
| Doanh nghiệp | Tạo doanh nghiệp | ✅ | `customer.enterprise.create` |
| Doanh nghiệp | Chỉnh sửa doanh nghiệp | ✅ | `customer.enterprise.update` |
| Doanh nghiệp | Mở danh sách đơn hàng của doanh nghiệp | ✅ | `customer.enterprise.order.view` |

## 10. Kho và giao hàng

**Route:** `/warehouse/trong-kho`, `/warehouse/danh-sach-kho`, `/ship`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Tồn kho | Xem và lọc hàng trong kho | ✅ | `inventory.stock.view` |
| Nhập kho | Tạo phiếu nhập kho | ✅ | `inventory.receipt.create` |
| Nhập kho | Xem chi tiết phiếu nhập | ✅ | `inventory.receipt.view` |
| Nhập kho | Chỉnh sửa phiếu nhập | ✅ | `inventory.receipt.update` |
| Chuyển kho | Chuyển số lượng giữa các kho | ✅ | `inventory.transfer.create` |
| Xuất kho | Tạo giao hàng từ dòng tồn kho | ✅ | `inventory.delivery.create` |
| Danh sách kho | Xem và lọc kho | ✅ | `inventory.warehouse.view` |
| Danh sách kho | Tạo kho | ✅ | `inventory.warehouse.create` |
| Danh sách kho | Chỉnh sửa kho | ✅ | `inventory.warehouse.update` |
| Giao hàng | Xem và lọc danh sách giao hàng | ✅ | `shipping.delivery.view` |
| Giao hàng | Xem/cập nhật trạng thái giao hàng | ✅ | `shipping.delivery.update` |
| Giao hàng | In phiếu giao hàng | ✅ | `shipping.delivery.print` |

## 11. KPI

**Route:** `/kpi`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| KPI | Xem dashboard KPI theo kỳ | ✅ | `kpi.view` |
| KPI | Tìm kiếm/lọc nhân viên cần chú ý | ✅ | `kpi.view` |
| KPI | Xem chi tiết KPI nhân viên | ✅ | `kpi.employee.view` |
| KPI | Tạo chỉ tiêu KPI | ✅ | `kpi.indicator.create` |
| KPI | Chỉnh sửa chỉ tiêu KPI | ✅ | `kpi.indicator.update` |
| KPI | Xóa chỉ tiêu KPI | ⚠️ | `kpi.indicator.delete` |

Nút “Xóa chỉ tiêu” hiện chỉ đóng drawer, chưa thấy gọi API xóa; chưa nên cấp quyền `delete` cho đến khi nghiệp vụ hoàn chỉnh.

## 12. Sản phẩm

**Route:** `/product`, `/product/edit/:id`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Sản phẩm | Xem và lọc danh sách | ✅ | `catalog.product.view` |
| Sản phẩm | Tạo sản phẩm, SKU và giá SKU | ✅ | `catalog.product.create` |
| Sản phẩm | Chỉnh sửa sản phẩm, SKU và giá SKU | ✅ | `catalog.product.update` |
| Sản phẩm | Quản lý thuộc tính và giá trị thuộc tính | ✅ | `catalog.product.attribute.manage` |
| Sản phẩm | Tải ảnh/file, chọn ảnh đại diện và ảnh slide | ✅ | `catalog.product.media.manage` |
| Sản phẩm | Gắn workflow | ✅ | `catalog.product.workflow.attach` |
| Sản phẩm | Xem tiến trình workflow | ✅ | `catalog.product.workflow.view` |
| BOM sản phẩm | Xem và cấu hình BOM | ✅ | `catalog.product.bom.view` |
| BOM sản phẩm | Tạo/xóa version và lưu vật tư BOM | ✅ | `catalog.product.bom.manage` |

Không thấy action xóa sản phẩm trực tiếp trong danh sách hiện tại.

## 13. Nguyên vật liệu và nhà cung cấp

**Route:** `/material`, `/provider`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Nguyên vật liệu | Xem và lọc danh sách | ✅ | `material.view` |
| Nguyên vật liệu | Tạo mới | ✅ | `material.create` |
| Nguyên vật liệu | Chỉnh sửa | ✅ | `material.update` |
| Nguyên vật liệu | Xóa | ✅ | `material.delete` |
| Nguyên vật liệu | Nhập số lượng vào kho | ✅ | `material.inventory.receipt` |
| Nhà cung cấp | Xem và lọc danh sách | ✅ | `supplier.view` |
| Nhà cung cấp | Xem chi tiết | ✅ | `supplier.detail.view` |
| Nhà cung cấp | Tạo mới | ✅ | `supplier.create` |
| Nhà cung cấp | Chỉnh sửa | ✅ | `supplier.update` |
| Nhà cung cấp | Quản lý danh sách nhà máy trong form | ✅ | `supplier.factory.manage` |

Không thấy action xóa nhà cung cấp ở danh sách; nút xóa trong form dùng để xóa dòng nhà máy.

## 14. Sản xuất

**Route:** `/material/bom`, `/sale/order-production`, `/sale/production/lots/create`, `/sale/order/progress/:orderId`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Lệnh sản xuất | Xem và lọc danh sách lệnh | ✅ | `manufacturing.order.view` |
| Lệnh sản xuất | Xem chi tiết | ✅ | `manufacturing.order.detail.view` |
| Lệnh sản xuất | Tạo lệnh từ đơn chờ sản xuất | ✅ | `manufacturing.order.create` |
| Lệnh sản xuất | Chỉnh sửa lệnh | ✅ | `manufacturing.order.update` |
| Lệnh sản xuất | Hủy lệnh trong luồng tạo/chỉnh sửa | ✅ | `manufacturing.order.cancel` |
| Lệnh sản xuất | Cập nhật trạng thái trực tiếp trên bảng | ✅ | `manufacturing.order.status.update` |
| Xác nhận BOM | Chọn version BOM và xác nhận vật tư | ✅ | `manufacturing.bom.confirm` |
| Phân bổ vật tư | Thêm/xóa phân bổ từ tồn kho | ✅ | `manufacturing.material.allocate` |
| Phân bổ vật tư | Chọn người xác nhận | ✅ | `manufacturing.material.assign_confirmer` |
| Tiến trình | Xem workflow, lịch sử và form đã gửi | ✅ | `manufacturing.progress.view` |
| Tiến trình | Thực hiện transition/gửi form | ✅ | `manufacturing.progress.execute` |
| Kiểm tra | Xem kết quả kiểm tra/NCR của lô | ✅ | `manufacturing.inspection.view` |

## 15. Web và nội dung

**Route nội bộ:** `/category/san-pham`, `/category/tin-tuc`, `/faq`, `/post`, `/post/edit`, `/tag`, `/tag/edit`, `/landing`, `/landing/edit`

**Route public:** `/m/:pageId/*`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Danh mục sản phẩm | Xem, tạo, sửa, xóa | ✅ | `web.product_category.view`, `web.product_category.create`, `web.product_category.update`, `web.product_category.delete` |
| Danh mục sản phẩm | Quản lý SEO, nội dung và ảnh | ✅ | `web.product_category.content.manage` |
| Danh mục tin tức | Xem, tạo, sửa, xóa | ✅ | `web.news_category.view`, `web.news_category.create`, `web.news_category.update`, `web.news_category.delete` |
| Danh mục tin tức | Quản lý ảnh đại diện | ✅ | `web.news_category.media.manage` |
| FAQ | Xem, tạo và sửa FAQ | ✅ | `web.faq.view`, `web.faq.create`, `web.faq.update` |
| Bài viết | Xem, tạo, sửa, xóa | ✅ | `web.post.view`, `web.post.create`, `web.post.update`, `web.post.delete` |
| Bài viết | Quản lý nội dung và ảnh đại diện | ✅ | `web.post.content.manage` |
| Tag | Xem, tạo, sửa, xóa | ✅ | `web.tag.view`, `web.tag.create`, `web.tag.update`, `web.tag.delete` |
| Landing Page | Xem danh sách và xem trước | ✅ | `web.landing.view` |
| Landing Page | Tạo trang trắng | ⚠️ | `web.landing.create` |
| Landing Page | Chỉnh sửa layout và block | ✅ | `web.landing.update` |
| Landing Page | Sao chép trang | ✅ | `web.landing.duplicate` |
| Landing Page | Xóa bản cục bộ | ⚠️ | `web.landing.delete` |
| Landing Page | Cấu hình API/data source | ✅ | `web.landing.api.manage` |
| Landing Page | Thêm và build custom JSX | ✅ | `web.landing.jsx.manage` |
| Landing Page | Lưu nháp | ✅ | `web.landing.save_draft` |
| Landing Page | Xuất bản | ✅ | `web.landing.publish` |
| Web runtime | Xem trang đã publish | 🌐 | Không áp dụng ACL nội bộ, trừ trang bật `authenticationRequired` |

Drawer tạo Landing Page đã có code nhưng chưa thấy nút mở `createOpen`. API xóa trang remote cũng chưa có nên nút xóa bị disable với dữ liệu từ API.

## 16. Tài khoản và cấu hình hệ thống

**Route:** `/user/list`, `/user/list-system`, `/user/group`, `/system/business-units`, `/system/general-config`, `/system/document-templates`, `/system/document-templates/create`, `/system/document-templates/:templateId/edit`, `/profile`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Tài khoản | Xem và lọc danh sách tài khoản | ✅ | `system.user.view` |
| Tài khoản | Tạo tài khoản | ✅ | `system.user.create` |
| Tài khoản | Chỉnh sửa tài khoản | ✅ | `system.user.update` |
| Tài khoản | Gán role/profile | ✅ | `system.user.role.assign` |
| Team | Xem danh sách nhóm | ✅ | `system.team.view` |
| Team | Tạo nhóm | ✅ | `system.team.create` |
| Team | Chỉnh sửa thành viên/phòng ban | ✅ | `system.team.update` |
| Đơn vị sử dụng | Xem danh sách đơn vị | 🔒 | `system.business_unit.view` |
| Đơn vị sử dụng | Tạo/chỉnh sửa đơn vị, logo và thông tin | 🔒 | `system.business_unit.manage` |
| Đơn vị sử dụng | Quản lý tài khoản và role trong đơn vị | 🔒 | `system.business_unit.user.manage` |
| Cấu hình chung | Xem danh sách cấu hình | ✅ | `system.config.view` |
| Cấu hình chung | Tạo cấu hình | ✅ | `system.config.create` |
| Cấu hình chung | Chỉnh sửa cấu hình | ✅ | `system.config.update` |
| Mẫu chứng từ | Xem và tìm kiếm template | ✅ | `system.document_template.view` |
| Mẫu chứng từ | Tạo template | ✅ | `system.document_template.create` |
| Mẫu chứng từ | Chỉnh sửa/import/xuất gói/xem trước template | ✅ | `system.document_template.update` |
| Mẫu chứng từ | Xóa template | ✅ | `system.document_template.delete` |
| Hồ sơ | Xem/cập nhật hồ sơ và thông tin doanh nghiệp | ✅ | `profile.update` |
| Hồ sơ | Đổi mật khẩu | ✅ | `profile.password.change` |
| Hồ sơ | Quản lý logo, chứng chỉ và file | ✅ | `profile.media.manage` |
| Hồ sơ | Cấu hình bố cục/API cá nhân | ✅ | `profile.layout.manage` |

`/system/business-units` hiện được chặn bằng `ROLE_SUPER_ADMIN`. Khi có ACL nên chuyển thành permission nhưng vẫn giữ Super Admin làm quyền bootstrap.

## 17. Nhân sự, lịch và chấm công

**Route:** `/employee`, `/cleander`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Nhân viên | Xem và lọc danh sách nhân viên | ✅ | `hr.employee.view` |
| Nhân viên | Tạo tài khoản/nhân viên | ✅ | `hr.employee.create` |
| Nhân viên | Xem/chỉnh sửa chi tiết | ✅ | `hr.employee.update` |
| Lịch | Xem lịch cá nhân/đơn vị | ✅ | `hr.calendar.view` |
| Lịch | Tạo sự kiện | ✅ | `hr.calendar.create` |
| Lịch | Chỉnh sửa/kéo thả sự kiện | ✅ | `hr.calendar.update` |
| Lịch | Xóa sự kiện | ✅ | `hr.calendar.delete` |
| Timesheet | Xem bảng công | ✅ | `hr.timesheet.view` |
| Timesheet | Cập nhật dữ liệu bổ sung | ✅ | `hr.timesheet.update` |
| Timesheet | Gửi bảng công | ✅ | `hr.timesheet.submit` |
| Timesheet | Leader kiểm tra bảng công | 🔒 | `hr.timesheet.check` |
| Timesheet | Manager xác nhận bảng công | 🔒 | `hr.timesheet.approve` |

Route `/cleander` đang sai chính tả nhưng là route thực tế; không nên sửa URL trong lúc triển khai ACL nếu chưa có kế hoạch redirect tương thích.

## 18. Booking hành chính

**Route:** `/booking`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Đặt xe | Xem/lọc danh sách đăng ký | ✅ | `hr.booking.car.view` |
| Đặt xe | Tạo/chỉnh sửa đăng ký | ✅ | `hr.booking.car.create`, `hr.booking.car.update` |
| Đặt xe | Gửi duyệt | ✅ | `hr.booking.car.submit` |
| Đặt xe | Kiểm tra, duyệt hoặc hủy | 🔒 | `hr.booking.car.approve` |
| Đặt xe | Xuất Excel khi hoàn tất | ✅ | `hr.booking.car.export` |
| Máy bay | Xem/lọc danh sách đăng ký | ✅ | `hr.booking.flight.view` |
| Máy bay | Tạo/chỉnh sửa và gửi duyệt | ✅ | `hr.booking.flight.create`, `hr.booking.flight.update`, `hr.booking.flight.submit` |
| Máy bay | Kiểm tra, duyệt hoặc hủy | 🔒 | `hr.booking.flight.approve` |
| Máy bay | Xuất Excel | ✅ | `hr.booking.flight.export` |
| Khách sạn | Xem/lọc danh sách đăng ký | ✅ | `hr.booking.hotel.view` |
| Khách sạn | Tạo/chỉnh sửa và gửi duyệt | ✅ | `hr.booking.hotel.create`, `hr.booking.hotel.update`, `hr.booking.hotel.submit` |
| Khách sạn | Kiểm tra, duyệt hoặc hủy | 🔒 | `hr.booking.hotel.approve` |
| Khách sạn | Xuất Excel | ✅ | `hr.booking.hotel.export` |

Nên tách riêng `check`, `approve`, `reject` nếu doanh nghiệp có nhiều cấp duyệt; hiện UI xác định cấp xử lý qua `isLeader()` và `isManager()`.

## 19. Nghỉ phép và tăng ca

**Route:** `/leave`, `/overtime`

| Khu vực | Chức năng thực tế | Trạng thái | Permission đề xuất |
|---|---|---:|---|
| Nghỉ phép | Xem/lọc danh sách đơn | ✅ | `hr.leave.view` |
| Nghỉ phép | Tạo/chỉnh sửa đơn và upload file | ✅ | `hr.leave.create`, `hr.leave.update` |
| Nghỉ phép | Xem trước và gửi duyệt | ✅ | `hr.leave.submit` |
| Nghỉ phép | Kiểm tra/duyệt đơn | 🔒 | `hr.leave.approve` |
| Nghỉ phép | Không duyệt đơn | 🔒 | `hr.leave.reject` |
| Tăng ca | Xem/lọc danh sách đăng ký | ✅ | `hr.overtime.view` |
| Tăng ca | Tạo/chỉnh sửa đăng ký | ✅ | `hr.overtime.create`, `hr.overtime.update` |
| Tăng ca | Xem trước và gửi duyệt | ✅ | `hr.overtime.submit` |
| Tăng ca | Kiểm tra/duyệt đăng ký | 🔒 | `hr.overtime.approve` |
| Tăng ca | Không duyệt đăng ký | 🔒 | `hr.overtime.reject` |

## 20. Chức năng có source nhưng chưa được kích hoạt

Các mục dưới đây không được tính là chức năng đang hoạt động vì không có route đã đăng ký hoặc menu truy cập. Chỉ nên đưa vào ACL sau khi khôi phục đầy đủ luồng sử dụng.

| Khu vực | Source hiện có | Trạng thái |
|---|---|---:|
| Quản lý Email | `src/pages/email/index.js` có danh sách, tạo và sửa email qua drawer; không có route/menu đăng ký | ⚠️ |
| Trợ lý AI độc lập | Menu `/ai-agent` đang bị comment và không có route; AI nhúng trong Form Builder/Landing vẫn hoạt động và đã được liệt kê ở module tương ứng | ⚠️ |
| Quản lý QC độc lập | Các menu `/qc/criteria`, `/qc/checklist`, `/qc/defect` đang bị comment và không có route; phần kiểm tra QC gắn với lô sản xuất vẫn hoạt động | ⚠️ |

Hai màn Lead/cơ hội chăm sóc cũ cũng còn route config trong source nhưng config không được đăng ký; chi tiết được ghi ở phần route kỹ thuật bên dưới.

## 21. Route kỹ thuật và route không hiển thị ở sidebar

| Route | Loại | Ghi chú |
|---|---|---|
| `/login` | Guest | Đăng nhập, không đưa vào ACL chức năng |
| `/permission-deny` | Guest/error | Trang từ chối truy cập |
| `/profile` | Nội bộ | Mở từ header, không nằm trong sidebar chính |
| `/notifications` | Nội bộ | Mở từ header, không nằm trong sidebar chính |
| `/user/list` | Nội bộ/legacy | Có route quản lý tài khoản riêng ngoài `/user/list-system` |
| `/product/edit/:id` | Nội bộ | Màn chỉnh sửa nội dung/hình ảnh sản phẩm |
| `/post/edit`, `/tag/edit`, `/landing/edit` | Nội bộ | Route editor, phải guard cả khi truy cập URL trực tiếp |
| `/workflow-form/*` | Nội bộ | Wildcard Form Builder, phải guard route con |
| `/sale/order/progress/:orderId` | Nội bộ | Route workflow/tiến trình, không chỉ dựa vào việc ẩn nút |
| `/m/:pageId/*` | Public | Runtime trang web; có thể yêu cầu login theo cấu hình trang |

Hai file route legacy vẫn tồn tại nhưng **không được thêm vào `routeConfigs`**:

- `/customer-service/lead` trong `Lead3DayConfig.js`.
- `/customer-service/co-hoi` trong `CohoiNotTakeConfig.js`.

Chức năng tương ứng hiện đi qua `/lead/three-day` và `/sale/co-hoi/seven-day` trong các route wildcard đang hoạt động.

## 22. Permission tối thiểu để mở màn quản trị phân quyền

Đề xuất thêm module riêng:

| Chức năng | Permission đề xuất |
|---|---|
| Xem danh mục permission | `system.permission.view` |
| Xem quyền hiệu lực của role/tài khoản | `system.permission.assignment.view` |
| Cấp hoặc thu hồi quyền | `system.permission.assignment.manage` |
| Sao chép quyền giữa role/tài khoản | `system.permission.assignment.copy` |
| Xem lịch sử thay đổi quyền | `system.permission.audit.view` |

`ROLE_SUPER_ADMIN` nên luôn có toàn quyền để tránh tự khóa hệ thống. `ROLE_ADMIN` chỉ được quản trị ACL khi có `system.permission.assignment.manage`.

## 23. Lưu ý khi chuyển danh mục này thành code

1. Permission `view` quyết định cả menu và route; không lưu thêm cờ `visible` độc lập.
2. Menu cha hiển thị khi còn ít nhất một menu con được phép xem.
3. Button, link, dropdown, drawer và modal đều phải kiểm tra permission ở điểm kích hoạt.
4. Điều kiện nghiệp vụ vẫn áp dụng cùng permission, ví dụ người duyệt được chỉ định và trạng thái chờ duyệt.
5. BE phải kiểm tra cùng permission code tại API; kiểm tra trên FE chỉ phục vụ UX.
6. Trong thời gian chuyển đổi, ánh xạ `ROLE_*` hiện tại sang permission mặc định rồi thay từng module theo thứ tự Lead → Cơ hội → Đơn hàng → Sản phẩm → Kho → Hệ thống.
