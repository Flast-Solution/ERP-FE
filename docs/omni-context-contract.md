# Omni-Channel — Hợp đồng API cột phải (Context Panel)

Tài liệu chốt giữa FE và BE. FE mock theo đúng file này, BE hiện thực theo đúng file này.

---

## 1. Endpoint

```
GET /omni/conversation/{conversationId}/context
```

**Một request duy nhất** trả về toàn bộ cột phải. Không tách thành 4 API (customer / lead / cơ hội / đơn) — mỗi lần đổi hội thoại mà bắn 4 request thì cột phải nhấp nháy và trễ rõ rệt.

Quyền: chỉ trả về nếu user có quyền trên `channel_account` của hội thoại đó. Không có quyền trả `403`, không trả rỗng — FE cần phân biệt "không được xem" với "chưa có dữ liệu".

---

## 2. Cấu trúc trả về

```jsonc
{
  "errorCode": 200,
  "data": {
    "conversationId": 1042,

    /* ---- Định danh trên nền tảng (luôn có) ---- */
    "identity": {
      "id": 88,
      "channelType": 1,                    /* 1=zalo_oa, 2=facebook */
      "channelAccountId": 5,
      "channelAccountName": "Flast Dệt May",
      "externalUserId": "3891042...",
      "displayName": "Lan Nguyen",
      "avatar": "https://.../avatar.jpg",
      "linked": true,
      "linkedAt": "2026-09-10T03:12:00Z",
      "linkedByName": "Trần Văn B"
    },

    /* ---- Khách hàng trong ERP. null = chưa gắn ---- */
    "customer": {
      "id": 5567,
      "name": "Nguyễn Thị Lan",
      "mobile": "0912345678",
      "email": "lan@vietthang.vn",
      "type": 2,                           /* 1=khách lẻ, 2=doanh nghiệp */
      "companyName": "Cty TNHH Việt Thắng",
      "ownerUserId": 31,
      "ownerName": "Trần Văn B",
      "debtAmount": 12500000,              /* công nợ hiện tại, VND */
      "totalOrderCount": 7,
      "totalOrderValue": 486000000,
      "detailUrl": "/customer/enterprise/5567"
    },

    /* ---- Các identity KHÁC của cùng khách hàng ---- */
    "siblingIdentities": [
      {
        "identityId": 91,
        "conversationId": 1187,            /* để FE bấm nhảy sang */
        "channelType": 2,
        "channelAccountName": "Flast Solution",
        "displayName": "Lan Nguyen",
        "lastMessageAt": "2026-09-14T08:20:00Z",
        "unreadCount": 2
      }
    ],

    /* ---- Lịch sử tương tác: lead / cơ hội / đơn hàng ---- */
    "timeline": [
      {
        "refType": 1,                      /* 1=lead */
        "refId": 9021,
        "code": "LEAD-9021",
        "title": "Hỏi báo giá áo thun cotton",
        "statusCode": 3,
        "statusName": "Đã tiếp nhận",
        "amount": null,
        "createdAt": "2026-08-02T04:10:00Z",
        "ownerName": "Trần Văn B",
        "detailUrl": "/lead/9021"
      },
      {
        "refType": 2,                      /* 2=cơ hội */
        "refId": 4410,
        "code": "CH-4410",
        "title": "Đồng phục 500 bộ",
        "statusCode": 2,
        "statusName": "Đang báo giá",
        "amount": 175000000,
        "createdAt": "2026-08-15T02:00:00Z",
        "ownerName": "Trần Văn B",
        "detailUrl": "/sale/co-hoi/4410"
      },
      {
        "refType": 3,                      /* 3=đơn hàng */
        "refId": 7788,
        "code": "DH-7788",
        "title": "Áo thun cotton 1200 cái",
        "statusCode": 5,
        "statusName": "Đang sản xuất",
        "amount": 312000000,
        "createdAt": "2026-08-20T07:30:00Z",
        "ownerName": "Trần Văn B",
        "detailUrl": "/sale/order/progress/7788"
      }
    ]
  }
}
```

---

## 3. Quy tắc dữ liệu

### 3.1 Ba trạng thái quyết định giao diện

FE render theo `identity.linked` và `timeline`:

| Trạng thái | Điều kiện | Cột phải hiển thị |
|---|---|---|
| Chưa gắn | `customer === null` | thông tin nền tảng + nút **Tạo Lead** |
| Đã gắn | `customer !== null`, `timeline` rỗng | thông tin khách, không có nút hành động |
| Có lịch sử | `timeline` không rỗng | thông tin khách + timeline (thuần đọc, bấm sang `detailUrl`) |

BE **không** trả thêm trường `state` — FE tự suy ra. Thêm trường đó sẽ có hai nguồn sự thật, lệch nhau là bug.

### 3.2 `timeline` gộp cả 3 loại vào một mảng

Sắp xếp theo `createdAt` **giảm dần** (mới nhất lên trước), không nhóm theo loại. Lý do: sale cần thấy diễn biến theo thời gian, không phải theo phân loại.

Giới hạn 20 mục gần nhất. Nhiều hơn thì FE điều hướng sang màn khách hàng.

### 3.3 `detailUrl` do BE sinh

FE không tự ghép route từ `refType` + `refId`. Route trong ERP có thể đổi, và một số loại có route khác nhau tùy trạng thái (đơn đang sản xuất vs đơn đã đóng). Để BE quyết là một chỗ sửa duy nhất.

### 3.4 Các trường có thể null

`customer`, `amount`, `linkedByName` — FE đã xử lý null. Ngược lại `identity`, `timeline`, `siblingIdentities` **luôn có mặt**, mảng rỗng thay vì null.

---

## 4. Các endpoint hành động liên quan

Cột phải gọi thêm 2 endpoint. Sau mỗi lần thành công, FE cập nhật store cục bộ (`linkCustomer` / `addRef`) chứ **không** gọi lại context — tránh nhấp nháy.

### 4.1 Gắn identity vào khách hàng có sẵn

```
POST /omni/identity/{identityId}/link
body: { "customerId": 5567 }
```
Trả về đúng khối `customer` như trên.

### 4.2 Tạo Lead từ hội thoại

```
POST /omni/conversation/{conversationId}/create-lead
body: {
  "fullName": "Nguyễn Thị Lan",
  "mobile": "0912345678",
  "note": "...",
  "customerId": null          /* != null nghĩa là gắn vào khách có sẵn, không tạo mới */
}
```

BE tự làm 3 việc trong một transaction: tạo/lấy customer → set `identity.customer_id` → tạo lead với `source` = kênh tương ứng. Trả về `{ customer, timelineItem }`.

`mobile` do sale tư vấn lấy được rồi tự nhập — hệ thống không tự bắt số trong nội dung chat.

Đây là **điểm kiểm trùng duy nhất** của cả module. Nếu `mobile` trùng một customer khác mà `customerId` không được truyền → trả `errorCode` riêng kèm danh sách customer trùng, để FE hiện popup xác nhận (dùng `HASH_POPUP`): *gắn vào khách có sẵn* hoặc *vẫn tạo mới*.

---

## 5. Ghi chú hiệu năng

`customer.debtAmount`, `totalOrderCount`, `totalOrderValue` là 3 trường tốn query nhất. Nếu làm chậm response, tách thành endpoint phụ nạp sau và để FE hiện skeleton riêng cho khối đó — nhưng **chỉ khi đo được là chậm**, đừng tách sẵn.

Mục tiêu: dưới 300ms. Cột phải đổi mỗi lần sale click một hội thoại, tần suất rất cao.
