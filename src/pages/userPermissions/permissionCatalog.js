const permission = (label, code) => ({ label, code })

const menu = (group, name, path, functions) => ({
  group,
  name,
  path,
  functions,
  viewPermission: functions.find(item => item.code.endsWith('.view'))?.code,
})

const p = permission

// Đồng bộ với docs/permission-function-inventory.md. Quyền *.view đầu tiên của
// mỗi mục là quyền bật/tắt menu; các quyền còn lại là chức năng trong menu đó.
export const PERMISSION_MENUS = [
  menu('Dashboard & thông báo', 'Dashboard', '/sale/report-common', [
    p('Xem tổng quan hoạt động', 'dashboard.view'),
    p('Xem biểu đồ Lead', 'dashboard.lead.view'),
    p('Xem biểu đồ doanh thu', 'dashboard.revenue.view'),
    p('Xem biểu đồ bán hàng', 'dashboard.sales.view'),
  ]),
  menu('Dashboard & thông báo', 'Thông báo', '/notifications', [
    p('Xem tất cả thông báo', 'notification.view'),
    p('Đánh dấu đã đọc', 'notification.mark_read'),
  ]),
  menu('Dự án & công việc', 'Dự án', '/task', [
    p('Xem danh sách dự án', 'project.view'), p('Xem chi tiết và lịch', 'project.detail.view'),
    p('Tạo dự án', 'project.create'), p('Chỉnh sửa dự án', 'project.update'),
    p('Xóa dự án', 'project.delete'), p('Cập nhật tiến độ', 'project.progress.update'),
  ]),
  menu('Dự án & công việc', 'Công việc', '/task/calendar/:id', [
    p('Xem lịch công việc', 'project.task.view'), p('Tạo công việc', 'project.task.create'),
    p('Chỉnh sửa công việc', 'project.task.update'), p('Xóa công việc', 'project.task.delete'),
  ]),
  menu('Bán hàng', 'Lead', '/lead', [
    p('Xem danh sách Lead', 'sales.lead.view'), p('Xem chi tiết Lead', 'sales.lead.detail.view'),
    p('Tạo Lead', 'sales.lead.create'), p('Chỉnh sửa Lead', 'sales.lead.update'),
    p('Chuyển Lead', 'sales.lead.assign'), p('Tạo cơ hội', 'sales.lead.convert_opportunity'),
    p('Xem workflow', 'sales.lead.workflow.view'), p('Chuyển trạng thái', 'sales.lead.stage.update'),
  ]),
  menu('Bán hàng', 'Lead 3 ngày', '/lead/three-day', [
    p('Xem Lead quá hạn', 'sales.lead.overdue.view'), p('Cập nhật chăm sóc', 'sales.lead.overdue.update'),
  ]),
  menu('Bán hàng', 'Báo cáo Lead', '/lead/report', [p('Xem báo cáo Lead', 'sales.lead.report.view')]),
  menu('Bán hàng', 'Bot dữ liệu', '/bot', [
    p('Xem dữ liệu Lead lạnh', 'sales.lead.cold.view'), p('Nhập dữ liệu', 'sales.lead.cold.create'),
    p('Chỉnh sửa dữ liệu', 'sales.lead.cold.update'),
    p('Tạo cơ hội', 'sales.lead.cold.convert_opportunity'), p('Xuất Excel', 'sales.lead.cold.export'),
  ]),
  menu('Bán hàng', 'Cơ hội', '/sale/co-hoi', [
    p('Xem danh sách cơ hội', 'sales.opportunity.view'), p('Xem chi tiết', 'sales.opportunity.detail.view'),
    p('Tạo cơ hội', 'sales.opportunity.create'), p('Chỉnh sửa cơ hội', 'sales.opportunity.update'),
    p('Quản lý sản phẩm', 'sales.opportunity.product.manage'),
    p('Cập nhật thông tin sản phẩm', 'sales.opportunity.product.update'), p('Lưu cơ hội', 'sales.opportunity.save'),
    p('Gắn workflow', 'sales.opportunity.workflow.attach'), p('Xem workflow', 'sales.opportunity.workflow.view'),
  ]),
  menu('Bán hàng', 'Cơ hội 7 ngày', '/sale/co-hoi/seven-day', [
    p('Xem cơ hội quá hạn', 'sales.opportunity.overdue.view'),
    p('Cập nhật chăm sóc', 'sales.opportunity.overdue.update'),
  ]),
  menu('Bán hàng', 'Báo giá', '/sale/ban-hang/:orderId', [
    p('Xem báo giá', 'sales.quotation.view'), p('Chỉnh sửa mẫu', 'sales.quotation.update'),
    p('Chọn người phê duyệt', 'sales.quotation.assign_approver'), p('Gửi duyệt', 'sales.quotation.submit'),
    p('Duyệt', 'sales.quotation.approve'), p('Từ chối', 'sales.quotation.reject'),
    p('In PDF', 'sales.quotation.print'), p('Tải PDF', 'sales.quotation.export'),
  ]),
  menu('Đơn hàng', 'Danh sách đơn hàng', '/sale/order', [
    p('Xem danh sách đơn hàng', 'sales.order.view'), p('Xem chi tiết', 'sales.order.detail.view'),
    p('Chỉnh sửa đơn hàng', 'sales.order.update'),
    p('Gắn workflow', 'sales.order.workflow.attach'), p('Xem workflow', 'sales.order.workflow.view'),
    p('Thực hiện workflow', 'sales.order.workflow.execute'), p('Cập nhật công ty', 'sales.order.company.update'),
    p('Quản lý hợp đồng', 'sales.order.contract.manage'),
  ]),
  menu('Đơn hàng', 'Đơn hủy', '/sale/order/cancelled', [p('Xem đơn hủy', 'sales.order.cancelled.view')]),
  menu('Đơn hàng', 'Chăm sóc sau bán', '/sale/order/after-sale', [
    p('Xem đơn chưa chăm sóc', 'sales.order.after_sale.view'),
    p('Cập nhật chăm sóc', 'sales.order.after_sale.update'),
  ]),
  menu('Đơn hàng', 'Thanh toán', '/sale/order/:id', [
    p('Xem thanh toán', 'sales.order.payment.view'), p('Cập nhật phí', 'sales.order.payment.update_fee'),
    p('Ghi nhận thanh toán', 'sales.order.payment.create'),
  ]),
  menu('Đơn hàng', 'Hóa đơn', '/sale/order/:id', [
    p('Xem hóa đơn', 'sales.invoice.view'), p('Chỉnh sửa', 'sales.invoice.update'),
    p('Lưu hóa đơn', 'sales.invoice.save'), p('Duyệt', 'sales.invoice.approve'),
    p('Từ chối', 'sales.invoice.reject'), p('In PDF', 'sales.invoice.print'), p('Tải PDF', 'sales.invoice.export'),
  ]),
  menu('Đơn hàng', 'Lô sản xuất', '/sale/production/lots/create', [
    p('Xem danh sách lô', 'sales.order.lot.view'), p('Tạo lô', 'sales.order.lot.create'),
    p('Chỉnh sửa lô', 'sales.order.lot.update'), p('Gắn workflow', 'sales.order.lot.workflow.attach'),
    p('Xem workflow và kiểm tra', 'sales.order.lot.workflow.view'),
  ]),
  menu('Quy trình', 'Thiết kế workflow', '/workflow-designer', [
    p('Xem workflow', 'workflow.process.view'), p('Tạo workflow', 'workflow.process.create'),
    p('Chỉnh sửa workflow', 'workflow.process.update'), p('Thiết kế bước/transition', 'workflow.process.design'),
    p('Quản lý action', 'workflow.action.manage'), p('Quản lý guard', 'workflow.guard.manage'),
    p('Quản lý role transition', 'workflow.transition_role.manage'), p('Gắn form', 'workflow.form.attach'),
    p('Quản lý loại bước', 'workflow.step_type.manage'), p('Quản lý trạng thái', 'workflow.status.manage'),
  ]),
  menu('Quy trình', 'Form Builder', '/workflow-forms', [
    p('Xem danh sách form', 'workflow.form.view'), p('Tạo form', 'workflow.form.create'),
    p('Chỉnh sửa form', 'workflow.form.update'), p('Xem trước', 'workflow.form.preview'),
    p('Dùng AI thiết kế form', 'workflow.form.ai'),
  ]),
  menu('Quy trình', 'Dữ liệu form', '/workflow-form/*', [
    p('Xem dữ liệu', 'workflow.submission.view'), p('Thêm/sửa dữ liệu', 'workflow.submission.create'),
  ]),
  menu('Quy trình', 'Kanban đơn hàng', '/sale/drag-drop-order', [
    p('Xem Kanban', 'workflow.order_board.view'), p('Kéo thả trạng thái', 'workflow.order_board.move'),
    p('Cấu hình trạng thái', 'workflow.order_board.configure'),
  ]),
  menu('Kế toán', 'Công nợ', '/ke-toan/cong-no', [
    p('Xem công nợ', 'accounting.receivable.view'), p('Xem chi tiết', 'accounting.receivable.detail.view'),
  ]),
  menu('Kế toán', 'Duyệt tiền', '/ke-toan/confirm', [
    p('Xem lệnh thanh toán', 'accounting.payment_approval.view'),
    p('Xem chi tiết', 'accounting.payment_approval.detail.view'), p('Duyệt lệnh', 'accounting.payment_approval.approve'),
  ]),
  menu('Khách hàng', 'Khách lẻ', '/sale/m-customer', [
    p('Xem khách hàng', 'customer.retail.view'), p('Xem hồ sơ', 'customer.retail.detail.view'),
    p('Cập nhật thông tin', 'customer.retail.update'), p('Quản lý tag', 'customer.retail.tag.manage'),
    p('Quản lý địa chỉ', 'customer.retail.address.manage'), p('Xem chăm sóc', 'customer.retail.care.view'),
    p('Tạo cơ hội', 'customer.retail.convert_opportunity'),
  ]),
  menu('Khách hàng', 'Doanh nghiệp', '/customer/enterprise', [
    p('Xem doanh nghiệp', 'customer.enterprise.view'), p('Xem hồ sơ', 'customer.enterprise.detail.view'),
    p('Tạo doanh nghiệp', 'customer.enterprise.create'), p('Chỉnh sửa', 'customer.enterprise.update'),
    p('Xem đơn hàng', 'customer.enterprise.order.view'),
  ]),
  menu('Kho & giao hàng', 'Tồn kho', '/warehouse/trong-kho', [
    p('Xem tồn kho', 'inventory.stock.view'), p('Xem phiếu nhập', 'inventory.receipt.view'),
    p('Tạo phiếu nhập', 'inventory.receipt.create'), p('Sửa phiếu nhập', 'inventory.receipt.update'),
    p('Chuyển kho', 'inventory.transfer.create'), p('Tạo giao hàng', 'inventory.delivery.create'),
  ]),
  menu('Kho & giao hàng', 'Danh sách kho', '/warehouse/danh-sach-kho', [
    p('Xem danh sách kho', 'inventory.warehouse.view'), p('Tạo kho', 'inventory.warehouse.create'),
    p('Chỉnh sửa kho', 'inventory.warehouse.update'),
  ]),
  menu('Kho & giao hàng', 'Giao hàng', '/ship', [
    p('Xem giao hàng', 'shipping.delivery.view'), p('Cập nhật trạng thái', 'shipping.delivery.update'),
    p('In phiếu giao hàng', 'shipping.delivery.print'),
  ]),
  menu('KPI', 'KPI', '/kpi', [
    p('Xem KPI', 'kpi.view'), p('Xem KPI nhân viên', 'kpi.employee.view'),
    p('Tạo chỉ tiêu', 'kpi.indicator.create'), p('Chỉnh sửa chỉ tiêu', 'kpi.indicator.update'),
    p('Xóa chỉ tiêu', 'kpi.indicator.delete'),
  ]),
  menu('Sản phẩm & vật tư', 'Sản phẩm', '/product', [
    p('Xem sản phẩm', 'catalog.product.view'), p('Tạo sản phẩm', 'catalog.product.create'),
    p('Chỉnh sửa sản phẩm', 'catalog.product.update'), p('Quản lý thuộc tính', 'catalog.product.attribute.manage'),
    p('Quản lý media', 'catalog.product.media.manage'), p('Gắn workflow', 'catalog.product.workflow.attach'),
    p('Xem workflow', 'catalog.product.workflow.view'), p('Xem BOM', 'catalog.product.bom.view'),
    p('Quản lý BOM', 'catalog.product.bom.manage'),
  ]),
  menu('Sản phẩm & vật tư', 'Nguyên vật liệu', '/material', [
    p('Xem nguyên vật liệu', 'material.view'), p('Tạo mới', 'material.create'),
    p('Chỉnh sửa', 'material.update'), p('Xóa', 'material.delete'), p('Nhập kho', 'material.inventory.receipt'),
  ]),
  menu('Sản phẩm & vật tư', 'Nhà cung cấp', '/provider', [
    p('Xem nhà cung cấp', 'supplier.view'), p('Xem chi tiết', 'supplier.detail.view'),
    p('Tạo mới', 'supplier.create'), p('Chỉnh sửa', 'supplier.update'), p('Quản lý nhà máy', 'supplier.factory.manage'),
  ]),
  menu('Sản xuất', 'Lệnh sản xuất', '/sale/order-production', [
    p('Xem lệnh sản xuất', 'manufacturing.order.view'), p('Xem chi tiết', 'manufacturing.order.detail.view'),
    p('Tạo lệnh', 'manufacturing.order.create'), p('Chỉnh sửa lệnh', 'manufacturing.order.update'),
    p('Hủy lệnh', 'manufacturing.order.cancel'), p('Cập nhật trạng thái', 'manufacturing.order.status.update'),
    p('Xác nhận BOM', 'manufacturing.bom.confirm'), p('Phân bổ vật tư', 'manufacturing.material.allocate'),
    p('Chọn người xác nhận', 'manufacturing.material.assign_confirmer'),
    p('Xem tiến trình', 'manufacturing.progress.view'), p('Thực hiện tiến trình', 'manufacturing.progress.execute'),
    p('Xem kiểm tra/NCR', 'manufacturing.inspection.view'),
  ]),
  menu('Web', 'Danh mục sản phẩm', '/category/san-pham', [
    p('Xem danh mục', 'web.product_category.view'), p('Tạo', 'web.product_category.create'),
    p('Sửa', 'web.product_category.update'), p('Xóa', 'web.product_category.delete'),
    p('Quản lý nội dung/SEO', 'web.product_category.content.manage'),
  ]),
  menu('Web', 'Danh mục tin tức', '/category/tin-tuc', [
    p('Xem danh mục', 'web.news_category.view'), p('Tạo', 'web.news_category.create'),
    p('Sửa', 'web.news_category.update'), p('Xóa', 'web.news_category.delete'),
    p('Quản lý ảnh', 'web.news_category.media.manage'),
  ]),
  menu('Web', 'FAQ', '/faq', [
    p('Xem FAQ', 'web.faq.view'), p('Tạo FAQ', 'web.faq.create'), p('Sửa FAQ', 'web.faq.update'),
  ]),
  menu('Web', 'Bài viết', '/post', [
    p('Xem bài viết', 'web.post.view'), p('Tạo', 'web.post.create'), p('Sửa', 'web.post.update'),
    p('Xóa', 'web.post.delete'), p('Quản lý nội dung/ảnh', 'web.post.content.manage'),
  ]),
  menu('Web', 'Tag', '/tag', [
    p('Xem Tag', 'web.tag.view'), p('Tạo', 'web.tag.create'), p('Sửa', 'web.tag.update'), p('Xóa', 'web.tag.delete'),
  ]),
  menu('Web', 'Landing Page', '/landing', [
    p('Xem Landing Page', 'web.landing.view'), p('Tạo trang', 'web.landing.create'),
    p('Chỉnh sửa', 'web.landing.update'), p('Sao chép', 'web.landing.duplicate'), p('Xóa', 'web.landing.delete'),
    p('Cấu hình API', 'web.landing.api.manage'), p('Quản lý JSX', 'web.landing.jsx.manage'),
    p('Lưu nháp', 'web.landing.save_draft'), p('Xuất bản', 'web.landing.publish'),
  ]),
  menu('Tài khoản & hệ thống', 'Tài khoản hệ thống', '/user/list-system', [
    p('Xem tài khoản', 'system.user.view'), p('Tạo tài khoản', 'system.user.create'),
    p('Chỉnh sửa tài khoản', 'system.user.update'), p('Gán role/profile', 'system.user.role.assign'),
  ]),
  menu('Tài khoản & hệ thống', 'Team', '/user/group', [
    p('Xem Team', 'system.team.view'), p('Tạo Team', 'system.team.create'), p('Chỉnh sửa Team', 'system.team.update'),
  ]),
  menu('Tài khoản & hệ thống', 'Đơn vị sử dụng', '/system/business-units', [
    p('Xem đơn vị', 'system.business_unit.view'), p('Quản lý đơn vị', 'system.business_unit.manage'),
    p('Quản lý tài khoản đơn vị', 'system.business_unit.user.manage'),
  ]),
  menu('Tài khoản & hệ thống', 'Cấu hình chung', '/system/general-config', [
    p('Xem cấu hình', 'system.config.view'), p('Tạo cấu hình', 'system.config.create'),
    p('Chỉnh sửa cấu hình', 'system.config.update'),
  ]),
  menu('Tài khoản & hệ thống', 'Mẫu chứng từ', '/system/document-templates', [
    p('Xem mẫu chứng từ', 'system.document_template.view'), p('Tạo mẫu', 'system.document_template.create'),
    p('Chỉnh sửa/import/xuất', 'system.document_template.update'), p('Xóa mẫu', 'system.document_template.delete'),
  ]),
  menu('Tài khoản & hệ thống', 'Phân quyền', '/user/permissions', [
    p('Xem danh mục quyền', 'system.permission.view'),
    p('Xem quyền tài khoản', 'system.permission.assignment.view'),
    p('Cấp/thu hồi quyền', 'system.permission.assignment.manage'),
    p('Sao chép quyền', 'system.permission.assignment.copy'), p('Xem lịch sử', 'system.permission.audit.view'),
  ]),
  menu('Nhân sự', 'Nhân viên', '/employee', [
    p('Xem nhân viên', 'hr.employee.view'), p('Tạo nhân viên', 'hr.employee.create'),
    p('Chỉnh sửa nhân viên', 'hr.employee.update'),
  ]),
  menu('Nhân sự', 'Lịch & bảng công', '/cleander', [
    p('Xem lịch', 'hr.calendar.view'), p('Tạo sự kiện', 'hr.calendar.create'),
    p('Chỉnh sửa sự kiện', 'hr.calendar.update'), p('Xóa sự kiện', 'hr.calendar.delete'),
    p('Xem bảng công', 'hr.timesheet.view'), p('Cập nhật bảng công', 'hr.timesheet.update'),
    p('Gửi bảng công', 'hr.timesheet.submit'), p('Kiểm tra bảng công', 'hr.timesheet.check'),
    p('Duyệt bảng công', 'hr.timesheet.approve'),
  ]),
  ...['car|Đặt xe', 'flight|Máy bay', 'hotel|Khách sạn'].map(value => {
    const [code, name] = value.split('|')
    return menu('Nhân sự', name, '/booking', [
      p(`Xem đăng ký ${name.toLowerCase()}`, `hr.booking.${code}.view`),
      p('Tạo đăng ký', `hr.booking.${code}.create`), p('Chỉnh sửa', `hr.booking.${code}.update`),
      p('Gửi duyệt', `hr.booking.${code}.submit`), p('Duyệt/hủy', `hr.booking.${code}.approve`),
      p('Xuất Excel', `hr.booking.${code}.export`),
    ])
  }),
  menu('Nhân sự', 'Nghỉ phép', '/leave', [
    p('Xem đơn nghỉ phép', 'hr.leave.view'), p('Tạo đơn', 'hr.leave.create'), p('Chỉnh sửa', 'hr.leave.update'),
    p('Gửi duyệt', 'hr.leave.submit'), p('Duyệt', 'hr.leave.approve'), p('Từ chối', 'hr.leave.reject'),
  ]),
  menu('Nhân sự', 'Tăng ca', '/overtime', [
    p('Xem đăng ký tăng ca', 'hr.overtime.view'), p('Tạo đăng ký', 'hr.overtime.create'),
    p('Chỉnh sửa', 'hr.overtime.update'), p('Gửi duyệt', 'hr.overtime.submit'),
    p('Duyệt', 'hr.overtime.approve'), p('Từ chối', 'hr.overtime.reject'),
  ]),
].filter(item => item.viewPermission)

export const ALL_PERMISSION_CODES = Array.from(new Set(
  PERMISSION_MENUS.flatMap(item => item.functions.map(fn => fn.code)),
))
