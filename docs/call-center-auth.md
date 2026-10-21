# Token tổng đài từ response đăng nhập

ERP-FE và ERP-IoNic đọc `data.user.sipExt` và `data.sipToken = {token, expires}` từ auth. `expires` là Unix timestamp giây. JWT ứng dụng và SIP bearer là hai token riêng.

Luồng: đăng nhập → BE xin SIP token → auth trả toàn bộ envelope → bridge bắt dữ liệu trước khi core chỉ emit user → store RAM riêng → gateway WebRTC dùng SIP bearer. Không gọi `/omni/webrtc/register` từ hai ứng dụng.

Bridge cũng bắt `jwtService.setSession` được gọi bởi `/auth/sign-with-token`, vì vậy BE cần trả `sipToken` cho cả khôi phục phiên. Không lưu SIP token vào localStorage, Preferences hoặc user persist. Đăng xuất hoặc response auth mới không có SIP token sẽ xóa token cũ; đổi tài khoản/máy nhánh tạo lại phiên WebRTC.

Thiếu token, hết hạn hoặc gateway trả 401: báo cần đăng nhập lại, dừng phiên/polling và nhả micro. Chưa có API gia hạn riêng được xác nhận nên không tự gọi endpoint cũ hoặc tự lặp request auth. HTTP 401 từ RTC không tự đăng xuất phiên ERP.

Gateway RTC giữ origin hiện có `https://ws.flast.vn/webrtc/sessions`. Việc BE đổi port PBX từ 8443 sang 443 thực hiện bên BE, không cần đưa địa chỉ PBX nội bộ vào FE.

Kiểm thử dùng token giả riêng, không tái sử dụng thông tin đăng nhập gửi qua chat. Chưa thử cuộc gọi thật; cần xác minh sign-in và sign-with-token đều có SIP token, gọi/nhận hai chiều và đăng xuất khi đang có cuộc gọi trên thiết bị thật.
