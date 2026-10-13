# Cảnh báo và việc

Chuông trên header mở bằng hover/click. Badge đỏ đếm cảnh báo cần xử lý, không phải số chưa xem. Chấm xanh thể hiện chưa xem; đánh dấu đã xem không đóng cảnh báo.

- Dropdown: 4 nhóm, mở drawer chi tiết, xử lý/nhắc nhanh, mở Trung tâm cảnh báo.
- Drawer: đối tượng, phụ trách, hạn, điều kiện khớp rule, gợi ý và lịch sử.
- Giao việc: tên/người/hạn bắt buộc, hạn trong tương lai; không tạo trùng việc đang mở. Việc xuất hiện ở icon cạnh chuông. Hoàn thành việc tự đóng cảnh báo.
- Bỏ qua: lý do bắt buộc; cảnh báo khẩn cấp có checkbox mô phỏng quản lý đồng ý. Hoàn tác trong 5 giây.
- Nhắc lại: mốc nhanh hoặc giờ riêng; tạm ẩn khỏi nhóm cần xử lý, đến giờ xuất hiện lại chưa xem. Từ lần nhắc thứ ba đánh dấu nâng cấp.
- Xử lý: hoạt động, kết quả và ghi chú bắt buộc; có thể tạo việc theo dõi tiếp. Hội thoại/hồ sơ/ghi âm là mô phỏng. Tệp chỉ lưu metadata, không upload nội dung.

Danh sách lấy bằng `RequestUtils.Get('/erp/notification/summary/closed-high')` khi header tải và khi mở chuông (hover/click). API dùng phiên đăng nhập hiện tại. Response `data.severityHight[].alerts` và `data.statusClose[].alerts` được chuẩn hóa cho dropdown/drawer; trường object được ưu tiên, các trường `*Json` là dự phòng. Không có dữ liệu mẫu khi API lỗi. UI hiển thị lỗi và nút thử lại, giữ danh sách lần tải thành công trong cùng phiên. Đổi doanh nghiệp/người dùng xóa danh sách cũ và bỏ qua response trễ của phiên cũ.

Giao việc gọi POST `/calendar/alert-task` với ownerId dạng string; xem việc gọi GET `/alert-task/{alertId}`. Bỏ qua, phê duyệt, hoàn tác gọi POST `/notification/action` với IGNORE/APPROVE/UNDO và version hiện tại; lý do bỏ qua không bắt buộc. UI đợi API thành công, sau đó tải lại summary và việc. API trả lỗi không thay đổi trạng thái thành công ở FE. Đánh dấu đã xem, nhắc lại và lưu chi tiết xử lý vẫn mô phỏng trong phiên. Task thật chưa có API hoàn thành nên chưa bật nút hoàn thành. Response API mới cần đối chiếu mẫu thực tế. Tải lại danh sách sẽ lấy trạng thái nghiệp vụ từ BE. Không lưu danh sách vào localStorage, không gửi thông báo hệ điều hành; timer nhắc lại chỉ hoạt động khi app mở.

Khi nối API hành động: BE xác minh quyền, phê duyệt quản lý, upload/ghi âm, rule và lịch sử. Hoàn tác chỉ sửa alert tương ứng, không ghi đè toàn bộ store.

## ERP_ALERT_RULES

`rules.js` lưu 36 mã `type` theo bảng nghiệp vụ. Normalizer tra `alert.type`, dự phòng `group.type`, để bổ sung tên, nhóm giai đoạn, mức độ mặc định, loại entity, nhóm người nhận, điều kiện kích hoạt tham khảo, mã/nhãn hành động, điều kiện tự đóng và cờ chặn nghiệp vụ. API có giá trị thì được ưu tiên (đặc biệt mức độ phân tầng của INVOICE_OVERDUE và điều kiện thực tế). Rule mới chưa có trong danh mục vẫn hiển thị từ dữ liệu API.

Danh mục này chỉ phục vụ hiển thị, không tạo cảnh báo, suy đoán điều kiện đã khớp, tự đóng hoặc thực thi chặn nghiệp vụ. Tham số trong bảng là tham khảo khi API chưa có điều kiện thực tế. Drawer hiển thị context từ BE. Form xử lý chọn hành động theo mã rule; nhóm entity LEAD/CUSTOMER/DEAL/QUOTE giữ lựa chọn chăm sóc khách, các entity khác dùng lựa chọn xử lý nghiệp vụ chung.
