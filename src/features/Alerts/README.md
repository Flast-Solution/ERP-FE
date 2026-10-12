# Cảnh báo và việc — demo FE

Chuông trên header mở bằng hover/click. Badge đỏ đếm cảnh báo cần xử lý, không phải số chưa xem. Chấm xanh thể hiện chưa xem; đánh dấu đã xem không đóng cảnh báo.

- Dropdown: 4 nhóm, mở drawer chi tiết, xử lý/nhắc nhanh, mở Trung tâm cảnh báo.
- Drawer: đối tượng, phụ trách, hạn, điều kiện khớp rule, gợi ý và lịch sử.
- Giao việc: tên/người/hạn bắt buộc, hạn trong tương lai; không tạo trùng việc đang mở. Việc xuất hiện ở icon cạnh chuông. Hoàn thành việc tự đóng cảnh báo.
- Bỏ qua: lý do bắt buộc; cảnh báo khẩn cấp có checkbox mô phỏng quản lý đồng ý. Hoàn tác trong 5 giây.
- Nhắc lại: mốc nhanh hoặc giờ riêng; tạm ẩn khỏi nhóm cần xử lý, đến giờ xuất hiện lại chưa xem. Từ lần nhắc thứ ba đánh dấu nâng cấp.
- Xử lý: hoạt động, kết quả và ghi chú bắt buộc; có thể tạo việc theo dõi tiếp. Hội thoại/hồ sơ/ghi âm là mô phỏng. Tệp chỉ lưu metadata, không upload nội dung.

State lưu localStorage theo bizId/userId, key `erp-alert-demo-v1`. Trung tâm có nút Khôi phục demo. Không gọi API nghiệp vụ, không gửi thông báo hệ điều hành; nhắc lại được kiểm tra mỗi 15 giây khi app mở, khi focus hoặc khi tải lại. Không chạy nhắc nền khi trình duyệt đóng.

Khi nối BE: thay repository state trong useNotifications bằng API, giữ model/action contract; BE xác minh quyền, phê duyệt quản lý, upload/ghi âm, rule và lịch sử. Hoàn tác chỉ sửa alert tương ứng, không ghi đè toàn bộ store.
