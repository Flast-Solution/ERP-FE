# Hướng dẫn làm việc trong repo

## Quy tắc code

- Tuân thủ cấu hình ESLint và Prettier hiện có của repo.
- Ưu tiên code rõ ràng, dễ đọc; không viết theo kiểu nén hoặc minify mã nguồn.
- Mỗi khai báo biến và mỗi câu lệnh viết trên một dòng riêng.
- Tách JSX nhiều thuộc tính, callback và logic điều kiện phức tạp thành nhiều dòng, theo Prettier của repo.
- Không dùng `eslint-disable`, `eslint-ignore` hoặc các cách tương tự để né lỗi.
- Không tự thay đổi hoặc nới lỏng cấu hình lint chỉ để kiểm tra chạy qua. Nếu cấu hình có vấn đề thật, giải thích nguyên nhân và đề xuất thay đổi trước khi thực hiện.
- Khi sửa lỗi lint hoặc format, giữ nguyên hành vi nghiệp vụ ngoài phạm vi yêu cầu.

## Kiểm tra trước khi hoàn tất

1. Format các file đã tạo hoặc sửa bằng Prettier theo cấu hình repo.
2. Chạy ESLint trên các file đã tạo hoặc sửa; xử lý hết lỗi và cảnh báo phát sinh từ thay đổi.
3. Chạy test phù hợp với phần code đã thay đổi và build khi cần xác minh tích hợp.
4. Kiểm tra diff để tránh thay đổi ngoài phạm vi hoặc vô tình ghi đè công việc của người dùng.
5. Báo rõ các kiểm tra đã chạy, kết quả, lỗi có sẵn và kiểm tra chưa thể thực hiện. Không khẳng định kiểm tra thành công khi chưa chạy.

Nếu repo chưa có công cụ hoặc cấu hình lint/format cần thiết, báo rõ hạn chế; không âm thầm bỏ qua bước kiểm tra hoặc dùng cấu hình khác rồi khẳng định repo đã đạt chuẩn.
