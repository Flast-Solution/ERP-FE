# Bàn giao BE: cấu hình micro frontend theo route doanh nghiệp

## 1. Phạm vi BE cần làm

Tạo hai API GET và POST để đọc/lưu toàn bộ cấu hình của doanh nghiệp hiện tại. FE đã có tab Profile → Route tuỳ chỉnh, loader Module Federation và adapter API. Không cần API riêng cho từng page, không cần BE build remote. Một remoteEntry.js có thể cung cấp nhiều module.

Các endpoint dưới đây dùng prefix `/api` theo môi trường ERP; FE gọi path `/business/custom-routes` qua client đã có baseURL. Nếu gateway dùng prefix khác, giữ resource path này sau baseURL.

- `GET /api/business/custom-routes`: mọi người dùng đã đăng nhập thuộc doanh nghiệp được đọc, để host quyết định màn hình.
- `POST /api/business/custom-routes`: chỉ quản trị viên `ROLE_ADMIN` / chủ doanh nghiệp `ROLE_PARTNER` trong đúng doanh nghiệp được sửa. Áp dụng quy tắc quyền hiện có tương ứng ở BE; FE đang kiểm tra hai role này.
- Xác định doanh nghiệp bằng phiên/token và cơ chế doanh nghiệp đang chọn hiện có. Không tin bizId trong payload. Payload bizId khác doanh nghiệp của request phải trả 403.

## 2. GET — mẫu response có cấu hình

Request không có query bizId và không có body. Dùng authentication hiện tại của ERP.

HTTP 200:

```json
{
  "errorCode": 200,
  "message": "success",
  "success": true,
  "data": {
    "bizId": 1649,
    "revision": 3,
    "remotes": [
      {
        "id": "hatenko",
        "remoteEntry": "https://remote.example.com/hatenko/remoteEntry.js",
        "scope": "hatenko",
        "version": "20261012-01"
      }
    ],
    "routes": [
      {
        "route": "/sale/order",
        "remoteId": "hatenko",
        "module": "OrderList",
        "enabled": true
      },
      {
        "route": "/material/bom",
        "remoteId": "hatenko",
        "module": "ProductionOrders",
        "enabled": true
      }
    ]
  }
}
```

URL example.com chỉ minh hoạ, cần thay bằng địa chỉ deploy remote thực tế truy cập được từ trình duyệt. `/sale/order` hiện dùng `OrderList`; màn tổng quan `OrderOverview` nằm tại `/sale/hateco`.

## 3. GET — doanh nghiệp chưa cấu hình

Trả HTTP 200, không trả 404, không dùng data null hoặc bỏ mảng:

```json
{
  "errorCode": 200,
  "message": "success",
  "success": true,
  "data": {
    "bizId": 2000,
    "revision": 0,
    "remotes": [],
    "routes": []
  }
}
```

Không có mapping hoặc mapping tắt → FE dùng màn hình mặc định. GET thất bại → FE hiện lỗi/thử lại; không tự coi là cấu hình rỗng.

## 4. POST — lưu nguyên cấu hình

`Content-Type: application/json`. FE gửi toàn bộ remote và route, không phải cập nhật một phần. Phần tử bị bỏ khỏi mảng trong POST sẽ bị xoá sau khi lưu thành công.

Ví dụ người dùng tải revision 3 rồi tắt remote ở route bán hàng:

```json
{
  "bizId": 1649,
  "revision": 3,
  "remotes": [
    {
      "id": "hatenko",
      "remoteEntry": "https://remote.example.com/hatenko/remoteEntry.js",
      "scope": "hatenko",
      "version": "20261012-01"
    }
  ],
  "routes": [
    {
      "route": "/sale/order",
      "remoteId": "hatenko",
      "module": "OrderList",
      "enabled": false
    },
    {
      "route": "/material/bom",
      "remoteId": "hatenko",
      "module": "ProductionOrders",
      "enabled": true
    }
  ]
}
```

HTTP 200, trả nguyên cấu hình đã lưu với revision tăng 1:

```json
{
  "errorCode": 200,
  "message": "success",
  "success": true,
  "data": {
    "bizId": 1649,
    "revision": 4,
    "remotes": [
      {
        "id": "hatenko",
        "remoteEntry": "https://remote.example.com/hatenko/remoteEntry.js",
        "scope": "hatenko",
        "version": "20261012-01"
      }
    ],
    "routes": [
      {
        "route": "/sale/order",
        "remoteId": "hatenko",
        "module": "OrderList",
        "enabled": false
      },
      {
        "route": "/material/bom",
        "remoteId": "hatenko",
        "module": "ProductionOrders",
        "enabled": true
      }
    ]
  }
}
```

POST cấu hình rỗng cũng hợp lệ. Lần lưu đầu gửi revision 0. Validate và lưu tất cả trong một transaction; không ghi một phần nếu có lỗi. Kiểm tra revision và cập nhật phải nguyên tử: hai request cùng revision chỉ một request được thành công.

## 5. Trường dữ liệu và validation

| Trường | Kiểu | Yêu cầu |
| --- | --- | --- |
| bizId | number | Doanh nghiệp hiện tại; đối chiếu phiên/token |
| revision | integer | Không âm; do BE quản lý, tăng mỗi lần lưu thành công |
| remotes | array | Bắt buộc, cho phép rỗng |
| remotes[].id | string | Không rỗng, duy nhất trong doanh nghiệp, dùng làm tham chiếu |
| remotes[].remoteEntry | string | URL HTTP/HTTPS hợp lệ, không chứa username/password |
| remotes[].scope | string | Tên container; regex `^[a-zA-Z_$][\w$]*$` |
| remotes[].version | string | Cho phép rỗng; key phiên bản/cache do quản trị nhập |
| routes | array | Bắt buộc, cho phép rỗng |
| routes[].route | string | Duy nhất trong doanh nghiệp; thuộc danh sách route hỗ trợ bên dưới |
| routes[].remoteId | string | Phải tồn tại trong remotes của cùng payload, kể cả mapping tắt |
| routes[].module | string | Tên module expose; regex `^[\w/-]+$`, không rỗng |
| routes[].enabled | boolean | Bắt buộc, không nhận string `"true"` hoặc số |

`revision` và `version` khác nhau: revision là phiên bản cấu hình database; version là phiên bản artifact remote để FE thêm cache key khi tải remoteEntry.

URL remote sẽ thực thi JavaScript trong phiên ERP. BE cần kiểm tra nguồn remote theo danh sách origin/domain được phép cho môi trường. Production nên dùng HTTPS; localhost/HTTP chỉ dùng môi trường phát triển được cho phép. Không cần server tự fetch URL hoặc thực thi remote để validate; FE đã có nút kiểm tra tải module.

## 6. Danh sách route FE hiện hỗ trợ

| Route | Module Hatenko tham khảo |
| --- | --- |
| /sale/hateco | OrderOverview |
| /sale/order | OrderList |
| /sale/order/* | OrderList |
| /sale/order/after-sale | OrderList |
| /sale/order/cancelled | OrderList |
| /sale/ban-hang | SalesEditor |
| /sale/ban-hang/:orderId | SalesEditor |
| /sale/co-hoi | Opportunities |
| /sale/co-hoi/* | Opportunities |
| /sale/co-hoi/seven-day | Opportunities |
| /sale/order-production | ProductionTracking |
| /sale/order/progress | WorkflowProgress |
| /sale/order/progress/:orderId | WorkflowProgress |
| /sale/production/lots/create | ManufacturingLotCreate |
| /material/bom | ProductionOrders |

Module không cần bị giới hạn vào Hatenko; remote khác có thể dùng module khác. Route thì phải đồng bộ với danh sách FE. Đây là thay màn hình tại route có sẵn, không tạo route hoặc menu mới.

FE ưu tiên route cụ thể hơn wildcard; mapping cụ thể tắt sẽ dùng local, không lùi về wildcard đang bật. Popup/drawer bên trong route sử dụng cùng remote và các module phụ mà host yêu cầu, ví dụ Invoice/OrderPayment/WorkflowDrawer. BE chỉ lưu mapping, không xử lý rule khớp route hoặc tải module.

## 7. Response lỗi

Trả đúng HTTP status và cùng envelope, `success: false`. Không trả success true khi lỗi.

Ví dụ HTTP 409 khi revision cũ:

```json
{
  "errorCode": 409,
  "message": "Cấu hình đã được cập nhật bởi người khác. Vui lòng tải lại trước khi lưu.",
  "success": false,
  "data": null
}
```

Ví dụ HTTP 400:

```json
{
  "errorCode": 400,
  "message": "Route /material/bom tham chiếu remote không tồn tại.",
  "success": false,
  "data": null
}
```

| HTTP | Khi nào |
| --- | --- |
| 400 | Payload/URL/scope/module/route/reference sai hoặc bị trùng |
| 401 | Chưa đăng nhập hoặc phiên hết hạn |
| 403 | Không đủ quyền sửa hoặc doanh nghiệp không khớp |
| 409 | revision gửi lên khác revision database |
| 500 | Lỗi hệ thống; không cập nhật dữ liệu |

FE hiện dùng RequestUtils.Post cho POST; HTTP lỗi được xử lý bằng thông báo lỗi chung của client. Nếu cần hiển thị chính xác message BE cho từng lỗi HTTP thì có thể bổ sung mapping ở FE sau khi thống nhất API thực tế.

## 8. Lưu trữ và cache

BE có thể lưu một record JSON theo bizId: biz_id unique, revision, config_json (remotes/routes), updated_by, updated_at. Hoặc tách bảng remote/route, nhưng kết quả GET/POST giữ nguyên hợp đồng trên. Ghi audit người sửa và thay đổi cấu hình.

Cache cấu hình hiện nằm ở FE trong provider, theo phiên người dùng/doanh nghiệp. Đổi doanh nghiệp phải tải lại và bỏ response cũ. Sau POST thành công FE gọi GET để cập nhật. Không cần Redis cho giai đoạn này. GET nên trả `Cache-Control: private, no-store` để tránh proxy/browser dùng cấu hình của phiên trước; cache trong bộ nhớ FE vẫn hoạt động.

Phiên khác đang mở chưa tự nhận cấu hình API mới ngay; có thể tải lại trang/tab Profile. Nếu cần cập nhật tức thì nhiều phiên, sẽ thống nhất thêm polling hoặc event sau; BE chưa phải triển khai websocket cho yêu cầu này.

## 9. Checklist nghiệm thu BE

- GET doanh nghiệp chưa cấu hình trả mảng rỗng, revision 0.
- Lưu đầu tiên revision 0 → response revision 1; GET lại đúng dữ liệu.
- User thường GET được, POST bị 403.
- Không đọc/sửa chéo doanh nghiệp bằng payload hoặc session không hợp lệ.
- Hai POST cùng revision chỉ một thành công, request còn lại 409.
- Duplicate route, remote thiếu, URL/scope sai bị 400 và không ghi một phần.
- Mapping tắt vẫn được trả về; không lọc mất khỏi GET.
- POST bỏ mapping/remote hợp lệ → GET không còn phần tử đó.
- POST mảng rỗng → FE quay về màn hình mặc định.

## 10. FE sử dụng API

FE luôn gọi API bằng RequestUtils.Get/Post, adapter ở `src/features/TenantRoutes/service.js`. Không còn mock/localStorage hoặc biến chế độ. Không tự đồng bộ dữ liệu mock trước đây sang BE; cấu hình phải được lưu qua Profile hoặc seed tại BE.


Nút Xoá cấu hình trong Profile yêu cầu xác nhận, gọi POST cấu hình với remotes/routes rỗng và revision hiện tại; không cần endpoint DELETE riêng. Chức năng thêm cấu hình mẫu đã được bỏ.
