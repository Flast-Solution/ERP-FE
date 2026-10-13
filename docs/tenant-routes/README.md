# Cấu hình route remote theo doanh nghiệp

ERP-FE là host; fs-hatenko vẫn build/deploy riêng. Profile → Route tuỳ chỉnh quản lý remote và mapping. Route phải thuộc danh sách được hỗ trợ. Route không cấu hình hoặc tắt dùng local. Lỗi tải cấu hình/remote có UI thử lại, không fallback âm thầm. Quyền route gốc vẫn do Authorization của host kiểm tra.

## Sử dụng API

Profile → Route tuỳ chỉnh → Thêm remote → Thêm route → Lưu cấu hình. GET và POST `/api/business/custom-routes` luôn dùng RequestUtils với path `/business/custom-routes`. POST lưu nguyên cấu hình và trả revision mới. BE kiểm tra quyền, business, revision và nguồn remote được phép.

Cache chỉ nằm trong provider theo phiên/doanh nghiệp; refresh sau lưu, khi tải lại và khi đổi identity. Không còn mock/localStorage, không dùng biến REACT_APP_TENANT_ROUTES_MODE. API lỗi hiển thị UI thử lại, không fallback dữ liệu cũ.

Nút Xoá cấu hình có xác nhận và POST mảng remotes/routes rỗng; không cần DELETE riêng.

## Sau khi dọn Hatenko khỏi host

Menu đơn hàng luôn dẫn tới `/sale/order`, không kiểm tra bizId. Muốn màn tổng quan Hatenko trước đây trên `/sale/hateco` xuất hiện ở menu này, sửa mapping `/sale/order` sang module `OrderOverview` và bật mapping. Không tự chuyển/sửa cấu hình database. `/sale/hateco` vẫn là alias có thể cấu hình để các link cũ tiếp tục chạy.

Local ERP List không còn tracking layout/API riêng theo tenant, kể cả bizId 1649. Tracking và production overview được giữ trong remote. Những utility workflow/LOT còn dùng bởi host được giữ. Các bản sao columns, expanded row, hook search tracking và test tương ứng đã bỏ khỏi host; bộ nghiệp vụ/test remote vẫn giữ.

fs-hatenko không còn kiểm tra bizId để bật nghiệp vụ của module, không còn expose `Routes` hoặc export `hatenkoRoutes`. Host sở hữu router và phân quyền. Các module phụ, shared runtime và cầu nối loader cho workflow remote vẫn được giữ vì còn dùng.

## Phát triển remote local

ERP-FE `.env.development` đã cấu hình:

```dotenv
REACT_APP_TENANT_REMOTE_OVERRIDES={"hatenko":"http://localhost:3001/remoteEntry.js"}
```

Chạy `npm run dev` trong fs-hatenko và `npm start` trong ERP-FE. Sau khi đổi env cần restart host. Mapping route/module và enabled vẫn lấy từ API. URL override chỉ áp dụng khi NODE_ENV=development; không lưu lên BE, không dùng khi build production/test. Key ưu tiên remoteId, nếu không có dùng scope. Có thể khai báo nhiều remote trong cùng object JSON. Xoá biến hoặc đặt `{}` để development dùng lại URL API.

Nút Kiểm tra module trong Profile cũng tải URL local nếu có override. Các loader workflow sử dụng cùng scope cũng nhận override. Cấu hình remoteEntry hiển thị/lưu trong Profile vẫn là URL server. Dev server tự biên dịch fs-hatenko; có thể cần reload host để nhận component mới vì remote HMR không được đảm bảo xuyên host. Nếu port 3001 khác, đổi URL trong env. Production vẫn cần deploy toàn bộ dist của remote.
