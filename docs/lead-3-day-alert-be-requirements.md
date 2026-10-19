# Yêu cầu BE — Cảnh báo Lead quá hạn 3 ngày chưa ra cơ hội

Ngày: 19/10/2026. Phạm vi: chỉ cảnh báo Lead, tách từ tài liệu 6 cảnh báo nghiệp vụ.

> Tài liệu để gửi BE chốt hợp đồng tích hợp. Phân biệt rõ API FE đã gọi với endpoint/field đề xuất. Sample là dữ liệu minh họa, không phải response production đã xác minh. Tài liệu này không tự thay đổi quy tắc đang chạy.

## 1. Mục tiêu và nội dung màn hình

Cảnh báo giúp sale biết lead nào đang chậm chuyển cơ hội và có đủ thông tin để liên hệ/xử lý ngay. Drawer gồm:

1. **Nhận diện:** mã cảnh báo, mức độ, trạng thái, tên cảnh báo, thời gian đã chờ và nguyên nhân kích hoạt.
2. **Khách hàng:** tên khách, loại khách, số điện thoại, nguồn, trạng thái lead, sale phụ trách; nút mở đúng lead.
3. **Nhu cầu:** sản phẩm quan tâm, số lượng + đơn vị, mức độ quan tâm, lịch hẹn, lần liên hệ gần nhất.
4. **Tương tác 3 ngày:** hai hàng riêng `Khách` và `Sale`, theo từng ngày; bấm ô có dữ liệu để xem nội dung/sự kiện.
5. **Hành động:** Bỏ qua, Nhắc lại, Giao việc, Gọi khách, Ghi nhận xử lý. Có lịch sử xử lý.

Không đưa dữ liệu mẫu vào response thực; dữ liệu thiếu không hiển thị như số 0 hay “không tương tác”.

## 2. Điều kiện kích hoạt — BE cần chốt trước

### 2.1. Điểm chưa thống nhất

Catalog FE hiện có `LEAD_STALE` với điều kiện **không hoạt động > 7 ngày**, trong khi thiết kế là **lead 3 ngày chưa ra cơ hội**. Hai điều kiện này không tương đương. Không chỉ đổi nhãn từ 7 sang 3.

BE/nghiệp vụ cần xác nhận:

| Nội dung | Cần quyết định |
|---|---|
| Mã rule | Giữ `LEAD_STALE` có cấu hình riêng hay tách `LEAD_3_DAY`? FE hiện nhận diện được cả hai mã nhưng chưa có hợp đồng BE chính thức |
| Mốc tính 3 ngày | Từ `lead.createdAt`, lúc giao lead cho sale, hay lần tương tác cuối? |
| Cách tính | 72 giờ liên tục hay 3 ngày lịch? Có loại ngày nghỉ không? |
| Ngưỡng | Đủ 3 ngày (`>= 72h`) hay quá 3 ngày (`> 72h`)? |
| Vai trò tương tác | Không có cơ hội sau 3 ngày là đủ kích hoạt, hay phải đồng thời không có tương tác? |
| Nguồn tương tác | Những loại tin nhắn, cuộc gọi và ghi chú nào được tính; cuộc gọi thất bại có tính không? |
| Loại trừ | Những trạng thái đóng/hủy/trùng/không phù hợp nào không còn phải chăm sóc? BE gửi mã trạng thái thực tế |

### 2.2. Hai phương án cần phân biệt

- **A — Chậm chuyển cơ hội:** lead còn hiệu lực, tuổi lead đạt ngưỡng, chưa có cơ hội. Vẫn cảnh báo dù sale đang liên hệ. Timeline chỉ cung cấp ngữ cảnh.
- **B — Chậm chuyển cơ hội và không được chăm sóc:** các điều kiện A **và** không có tương tác hợp lệ từ khách/sale trong khoảng 72 giờ gần nhất.

Sample trong tài liệu minh họa **B, ngưỡng `>= 72h`, tính từ lúc tạo lead**, chưa phải quyết định nghiệp vụ. Nếu chọn A, BE bỏ điều kiện không tương tác và thay nội dung banner/điều kiện tự đóng tương ứng.

Ví dụ sample: tạo lead `16/10/2026 09:00 +07:00`; đánh giá `19/10/2026 12:00 +07:00` → tuổi lead 75 giờ. Chưa có cơ hội; không tương tác trong 72 giờ gần nhất và nguồn tương tác được xác nhận đầy đủ.

### 2.3. Vòng đời cảnh báo

- BE đánh giá rule và phát sinh cảnh báo, không phụ thuộc người dùng mở trang.
- Một lead/rule chỉ có một cảnh báo mở cho cùng đợt vi phạm; job chạy lặp không sinh thêm bản ghi trùng.
- Giao việc, đánh dấu đã đọc, mở lead hoặc bấm Gọi khách không mặc nhiên đóng cảnh báo.
- Ghi chú xử lý không tự tính là tương tác hợp lệ, trừ khi hai bên đã chốt nó là activity nghiệp vụ.
- Với A: có tương tác mới vẫn có thể còn vi phạm. Với B: tương tác hợp lệ mới có thể làm hết vi phạm; nếu sau đó tiếp tục không được chăm sóc đủ thời gian, BE đánh giá lại.
- BE kiểm tra lại sau chuyển cơ hội, cập nhật trạng thái lead, activity mới hoặc theo lịch. Cần chốt độ trễ cập nhật và cách mở lại/sinh đợt cảnh báo mới.
- Lead đóng/hủy phải xử lý theo danh mục trạng thái thực tế; không chỉ dựa vào tên hiển thị.
- `triggeredAt`: lúc phát cảnh báo; `evaluatedAt`: lần kiểm tra gần nhất; `dueAt`: hạn xử lý cảnh báo nếu có. Không dùng `dueAt` thay ngày tạo lead để tính tuổi lead.

## 3. Dữ liệu BE cần cung cấp

### 3.1. Metadata cảnh báo

| Field đề xuất | Nội dung |
|---|---|
| `id`, `type`, `title`, `typeLabel` | ID, mã rule, tên và nhóm Lead |
| `severity`, `status`, `version` | Mức độ, trạng thái, phiên bản kiểm soát cập nhật |
| `entity.kind`, `entity.id`, `entity.code` | `LEAD`, ID thật của lead, mã lead; không dùng customerId/orderId thay leadId |
| `ownerId`, `ownerName` | Sale/người chịu trách nhiệm; BE quyết định quyền nhận cảnh báo |
| `triggeredAt`, `evaluatedAt`, `dueAt` | Các mốc riêng biệt, nullable khi chưa có hạn xử lý |
| `read`, `readAt` | Trạng thái đọc của user đang đăng nhập |
| `rule.parameters`, `rule.conditions` | Cấu hình thực tế và số đo kích hoạt, không để FE suy luận từ tiêu đề |
| `rule.autoClose`, `suggestedAction` | Điều kiện hết vi phạm và hành động gợi ý |

`HIGH`/`OPEN`/`LEAD_3_DAY` trong sample là mã minh họa. BE chốt enum thật; không ánh xạ “đã đọc” thành “đã xử lý”.

### 3.2. `businessData` cho drawer

| Nhóm | Field đề xuất | Ghi chú |
|---|---|---|
| Lead | `lead.id`, `code`, `createdAt`, `statusCode`, `statusName`, `sourceName`, `opportunityId`, `convertedAt`, `isClosed` | Cần xác định quan hệ chuyển đổi để kiểm tra chưa có cơ hội |
| Khách | `customer.id`, `name`, `typeLabel`, `mobilePhone` | SĐT giữ kiểu chuỗi, không mất số 0 đầu |
| Sale | `owner.id`, `owner.name` | Giao việc/liên kết dùng ID, hiển thị dùng tên |
| Nhu cầu | `productNames`, `expectedQuantity`, `quantityUnit`, `interestLabel` | Nếu có nhiều dòng sản phẩm/đơn vị khác nhau, cần thống nhất mảng chi tiết; không cộng các đơn vị khác nhau |
| Hẹn/liên hệ | `appointmentAt`, `lastContactedAt`, `lastCustomerInteractionAt`, `lastSaleInteractionAt` | Thời điểm không có phải khác với không tải được |
| Banner | `triggerSummary`, `triggerDetail`, `metricLabel` | Tóm tắt từ rule thật; nên kèm số đo trong `ruleEvaluation` |
| Timeline | `timeline`, `interactions` | Quy định ở mục 3.3 |
| Độ đầy đủ | `dataAvailability` | Dữ liệu đủ/thiếu, lý do và phạm vi kiểm tra |

### 3.3. Timeline và ý nghĩa của “không tương tác”

- FE hiện hiển thị **3 ngày lịch gần nhất**, kết thúc ở ngày đánh giá. Khoảng hiển thị này có thể khác cửa sổ 72 giờ dùng đánh giá rule. BE phải trả cả hai phạm vi nếu dùng phương án B.
- Mỗi event có `id`, `at`, `side: customer|sale`, `type`, `title`, `content` và `actorId` khi có.
- `timeline.complete: true` + `interactions: []`: xác nhận không có event trong cửa sổ hiển thị.
- `timeline.complete: false` + `interactions: []`: chưa đủ dữ liệu để kết luận. Trả lý do như `SOURCE_UNAVAILABLE`, `FORBIDDEN`, hoặc `PARTIAL_COVERAGE`.
- Không để “không có quyền xem nội dung” đồng nghĩa “không có tương tác”. BE vẫn có thể biết số tương tác; có thể ẩn nội dung nhưng cần mô tả rõ phạm vi đã che.
- Nếu chưa đồng bộ tổng đài/chat/ghi chú đầy đủ, BE không được dùng sự thiếu dữ liệu đó để khẳng định không liên hệ trong rule B.
- Thời gian ISO 8601 có offset; thống nhất `Asia/Ho_Chi_Minh`. Dùng ID event để tránh đếm trùng.

## 4. API đang có và phần cần bổ sung

Các path dưới đây chưa bao gồm base `/api`.

| API/cơ chế | Hiện tại trong FE | BE cần xác nhận/bổ sung |
|---|---|---|
| `GET /erp/notification/summary/closed-high` | Tải nhóm cảnh báo | Có trả Lead rule này cho đúng user không; cần ID/entity/version và metadata để mở drawer |
| `GET /erp/notification/alert/{id}` | Đọc tasks và có thể nhận `alert` | Đề xuất trả `{alert, tasks}` với `alert.businessData` đầy đủ; `tasks` luôn là mảng |
| `POST /calendar/alert-task` | Đã nối giao việc | Kiểm tra người được giao, expectedVersion, chống tạo việc trùng khi retry |
| `POST /notification/action` | Đã nối `IGNORE`, `REOPEN`, `APPROVE`, `UNDO` | Chốt action cho lead; FE hiện dùng `REOPEN` + `snoozedUntil` để nhắc lại |
| Lưu ghi nhận xử lý | Hiện chỉ trong phiên FE | Cần API lưu activity/ghi chú/kết quả/đính kèm, trả alert/version mới |
| Đã đọc | Hiện chỉ trong bộ nhớ FE | Cần lưu theo user và trả lại khi reload |
| Lịch sử | Hiện có lịch sử khởi tạo/cục bộ | Cần BE lưu và trả lịch sử thật |
| Truy vấn theo leadId | Hiện tìm trong summary đã tải | Cần truy vấn theo `entityKind=LEAD&entityId=...` hoặc mở rộng API có sẵn |

Đối với Lead, không gọi `/erp/order/view-on-edit` bằng leadId. Ưu tiên gom dữ liệu vào alert detail; nếu dùng API lead riêng thì BE gửi endpoint và response chính thức. Không đổi prefix API đang chạy nếu chưa chốt.

## 5. Response chi tiết mẫu

Đề xuất mở rộng `GET /erp/notification/alert/2101` theo envelope hiện tại:

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2101,
      "type": "LEAD_3_DAY",
      "title": "Lead 3 ngày chưa ra cơ hội",
      "typeLabel": "Lead",
      "severity": "HIGH",
      "status": "OPEN",
      "version": 1,
      "triggeredAt": "2026-10-19T09:30:00+07:00",
      "evaluatedAt": "2026-10-19T12:00:00+07:00",
      "dueAt": null,
      "read": false,
      "readAt": null,
      "ownerId": 901,
      "ownerName": "Sale minh họa",
      "entity": {
        "kind": "LEAD",
        "id": 101,
        "code": "DEMO-LEAD-001",
        "name": "Lead 3 ngày chưa ra cơ hội"
      },
      "rule": {
        "code": "LEAD_3_DAY",
        "name": "Lead 3 ngày chưa ra cơ hội",
        "description": "Lead được tạo ít nhất 72 giờ, chưa chuyển cơ hội và không có tương tác hợp lệ của khách/sale trong 72 giờ gần nhất. Quy tắc đề xuất, chờ xác nhận.",
        "parameters": {
          "thresholdHours": 72,
          "operator": "GTE",
          "ageClockStart": "lead.createdAt",
          "interactionWindowHours": 72,
          "requireNoOpportunity": true,
          "requireNoInteraction": true,
          "timezone": "Asia/Ho_Chi_Minh"
        },
        "conditions": [
          {
            "key": "leadAgeHours",
            "label": "Tuổi lead (giờ)",
            "actual": 75,
            "operator": "GTE",
            "expected": 72
          },
          {
            "key": "opportunityCount",
            "label": "Số cơ hội đã chuyển từ lead",
            "actual": 0,
            "operator": "EQ",
            "expected": 0
          },
          {
            "key": "interactionCount",
            "label": "Tương tác hợp lệ trong 72 giờ gần nhất",
            "actual": 0,
            "operator": "EQ",
            "expected": 0
          }
        ],
        "autoClose": "Kiểm tra lại sau khi chuyển cơ hội, có tương tác hợp lệ hoặc lead bị đóng/hủy theo quy tắc đã chốt."
      },
      "suggestedAction": {
        "code": "CONTACT_CUSTOMER",
        "label": "Gọi khách"
      },
      "businessData": {
        "triggerSummary": "Lead 3 ngày chưa chuyển cơ hội, không có tương tác",
        "triggerDetail": "Tạo lead 16/10/2026 09:00; chưa có cơ hội hoặc tương tác",
        "metricLabel": "3 ngày",
        "customer": {
          "id": 501,
          "name": "Khách hàng minh họa",
          "fullName": "Người liên hệ minh họa",
          "mobilePhone": "0900000000",
          "companyName": "Công ty minh họa",
          "typeLabel": "Doanh nghiệp",
          "address": "Địa chỉ minh họa"
        },
        "owner": {
          "id": 901,
          "name": "Sale minh họa"
        },
        "lead": {
          "id": 101,
          "createdAt": "2026-10-16T09:00:00+07:00",
          "sourceName": "Hotline",
          "statusName": "Mới",
          "opportunityId": null,
          "code": "DEMO-LEAD-001",
          "statusCode": "NEW",
          "isClosed": false,
          "convertedAt": null
        },
        "productNames": [
          "Vải minh họa"
        ],
        "expectedQuantity": 300,
        "quantityUnit": "m",
        "interestLabel": "Thấp",
        "appointmentAt": null,
        "lastContactedAt": null,
        "timeline": {
          "startDate": "2026-10-17T00:00:00+07:00",
          "endDate": "2026-10-19T12:00:00+07:00",
          "timezone": "Asia/Ho_Chi_Minh",
          "complete": true
        },
        "interactions": [],
        "dataAvailability": {
          "customer": {
            "complete": true
          },
          "timeline": {
            "complete": true,
            "coverageStart": "2026-10-16T09:00:00+07:00",
            "coverageEnd": "2026-10-19T12:00:00+07:00"
          }
        },
        "lastCustomerInteractionAt": null,
        "lastSaleInteractionAt": null,
        "ruleEvaluation": {
          "ageHours": 75,
          "interactionWindowStart": "2026-10-16T12:00:00+07:00",
          "interactionWindowEnd": "2026-10-19T12:00:00+07:00",
          "customerInteractionCount": 0,
          "saleInteractionCount": 0,
          "interactionsComplete": true
        }
      },
      "history": [
        {
          "id": 3101,
          "action": "TRIGGERED",
          "actor": {
            "kind": "SYSTEM",
            "id": null,
            "name": "Hệ thống"
          },
          "at": "2026-10-19T09:30:00+07:00",
          "text": "Hệ thống kích hoạt cảnh báo"
        }
      ]
    },
    "tasks": []
  }
}
```

### Ví dụ event khi có tương tác

Ví dụ độc lập để mô tả event; không ghép event mới này vào sample “không tương tác” mà vẫn giữ nguyên điều kiện rule B.

```json
{
  "id": 4201,
  "at": "2026-10-19T09:15:00+07:00",
  "side": "sale",
  "type": "CALL",
  "title": "Sale gọi khách",
  "content": "Khách hẹn liên hệ lại chiều nay",
  "actorId": 901,
  "durationSeconds": 80,
  "relatedEntity": { "kind": "LEAD", "id": 101 }
}
```

Nếu sau event BE đánh giá không còn vi phạm B, trả trạng thái đóng theo enum đã thống nhất và lịch sử thay đổi. Nếu dùng A thì event không đủ để đóng vì lead có thể vẫn chưa chuyển cơ hội.

## 6. Yêu cầu từng thao tác

### 6.1. Mở lead / Gọi khách

- Mở đúng `entity.id`, không chỉ điều hướng đến danh sách lead.
- BE trả SĐT và quyền dữ liệu phù hợp; không cần nhét token/mật khẩu tổng đài vào response cảnh báo.
- FE giữ quy tắc ẩn nút gọi nếu user chưa có `sipExt`; kết nối tổng đài phải sẵn sàng mới gọi được.
- Bấm nút gọi không chứng minh cuộc gọi thành công. Chỉ sự kiện cuộc gọi được xác nhận và đáp ứng định nghĩa activity mới được rule B tính.

### 6.2. Giao việc — API đã nối

`POST /calendar/alert-task`:

```json
{
  "alertId": 2101,
  "expectedVersion": 1,
  "task": {
    "title": "Liên hệ lead DEMO-LEAD-001",
    "ownerId": "901",
    "dueAt": "2026-10-20T09:00:00+07:00",
    "priority": "HIGH",
    "description": "Xác nhận nhu cầu và chuyển cơ hội khi đủ điều kiện"
  }
}
```

BE lấy người giao/doanh nghiệp từ phiên xác thực, kiểm tra quyền người nhận, lưu task và lịch sử. Đề nghị có requestId/idempotency nếu client retry. Hoàn thành task không mặc định đóng cảnh báo; BE kiểm tra lại nghiệp vụ.

### 6.3. Bỏ qua / Nhắc lại

`POST /notification/action`, ví dụ bỏ qua:

```json
{
  "alertId": 2101,
  "expectedVersion": 1,
  "action": "IGNORE",
  "reason": "Lead trùng và đang được xử lý ở hồ sơ khác"
}
```

- Bỏ qua cần lý do, kiểm tra quyền, lưu audit; không tự thay trạng thái lead.
- Nhắc lại chỉ tạm ẩn/hoãn nhắc tới thời điểm đã chọn; hết giờ BE trả trạng thái phù hợp với rule mới nhất.
- FE hiện gửi `REOPEN` cùng `snoozedUntil` dạng `YYYY-MM-DD HH:mm:ss`. BE xác nhận semantics/timezone; nếu dùng `SNOOZE` và ISO có offset, hai bên sửa đồng bộ.
- Không dùng `APPROVE` chung để kết luận lead đã được xử lý; BE chốt action nào áp dụng cho rule này.

### 6.4. Ghi nhận xử lý — endpoint đề xuất mới

Gợi ý `POST /erp/notification/alert/{id}/activities`; **chưa phải API đã được FE nối**:

```json
{
  "expectedVersion": 1,
  "requestId": "8edda941-143a-4ec9-8f21-011c88009eba",
  "activity": "CONTACT_CUSTOMER",
  "result": "FOLLOW_UP_REQUIRED",
  "notes": "Đã liên hệ, khách hẹn gọi lại",
  "attachments": [],
  "followUpAt": "2026-10-20T09:00:00+07:00"
}
```

- BE xác nhận enum activity/result và việc bản ghi này có tạo activity lead thật hay chỉ là nhật ký xử lý.
- Trả hoạt động đã lưu, alert/version mới và task/lịch nhắc nếu có tạo.
- Reload vẫn xem được ghi nhận. Retry cùng requestId không tạo thêm hoạt động/task.
- Nếu có tệp: phải upload thật, lưu fileId/filename hợp lệ; FE hiện giữ tên/kích thước tệp trong phiên, chưa đủ để BE có tài liệu.
- Nếu chọn thu âm: cần file/sự kiện từ tổng đài; một checkbox ở FE không phải bản ghi âm.
- `followUpAt` cần chốt tạo việc hay chỉ tạo nhắc; không tự suy luận là ngày hẹn với khách nếu chưa được xác nhận.

### 6.5. Đã đọc / Lịch sử / Truy vấn theo lead — đề xuất mới

- Đã đọc: gợi ý `POST /erp/notification/alert/{id}/read`. BE lưu theo user, không đánh dấu toàn doanh nghiệp.
- Lịch sử: trả trong alert detail hoặc endpoint lịch sử riêng, có ID, actor, thời điểm, action, nội dung và thay đổi trạng thái.
- Truy vấn theo lead: gợi ý `GET /erp/notification/alerts?entityKind=LEAD&entityId=101&page=1&limit=20`. Phải kiểm tra quyền và trả đúng lead dù chưa nằm trong summary hiện tại.
- Những endpoint gợi ý trên cần BE xác nhận hoặc thay bằng endpoint hiện có tương đương.

### 6.6. Quyền, version và đồng bộ

- Giới hạn theo doanh nghiệp và quyền user; người khác không được đọc/sửa cảnh báo chỉ bằng cách đổi alertId/leadId.
- Mutation dùng `expectedVersion`; lệch version trả HTTP 409, FE tải lại trước khi thao tác tiếp.
- Phản hồi thao tác nên có alert/version mới, để các máy không tự ghi đè trạng thái nhau.
- Chốt cơ chế refresh/event/poll và độ trễ job. Thông báo sau khi sửa nghiệp vụ phải phản ánh lần đánh giá mới.

## 7. Phần FE còn phải hoàn thiện sau khi BE chốt

1. Chuẩn hóa mapping rule và field chính thức, không suy luận từ tên cảnh báo.
2. Lấy businessData từ detail, đọc khoảng timeline/timezone đầy đủ, phân biệt nguồn thiếu với không có event. Giao diện hiện chưa dùng hết các trường dataAvailability/coverage được đề xuất.
3. Mở đúng trang chi tiết lead theo ID; hành động hiện còn có chỗ chỉ mở danh sách.
4. Thay ghi nhận xử lý/đã đọc cục bộ bằng API. Đọc lịch sử BE thay vì tự dựng; normalizer hiện chưa dùng lịch sử trả về đầy đủ.
5. Bỏ nhánh tự đóng cảnh báo cục bộ khi task hoàn thành; nhận trạng thái do BE đánh giá lại.
6. Tách nhãn/mã action/result, cập nhật request nhắc lại nếu thay semantics; bảo toàn version sau mỗi thao tác.
7. Thể hiện đơn vị số lượng nếu BE trả; không thêm dữ liệu giả khi thiếu trường.

## 8. Tiêu chí nghiệm thu

| Tình huống | Kết quả cần có |
|---|---|
| 71h59m, chưa cơ hội | Chưa kích hoạt với ngưỡng >=72h |
| Đúng 72h, chưa cơ hội, không tương tác | Kích hoạt nếu chốt GTE; chưa kích hoạt nếu chốt GT |
| Lead 75h, có cơ hội | Không còn cảnh báo chậm chuyển cơ hội |
| Lead 75h, vừa có tương tác hợp lệ, chưa cơ hội | A vẫn có thể cảnh báo; B không còn vi phạm |
| Lead đóng/hủy | Không tạo cảnh báo chăm sóc theo danh mục loại trừ đã chốt |
| Khách có tương tác nhưng sale chưa phản hồi | Timeline phân biệt hai phía; rule quyết định theo A/B đã chốt, không suy luận từ ô trống |
| Nguồn chat/call lỗi | Hiển thị thiếu dữ liệu; không kết luận không có tương tác để kích hoạt B |
| Hai sale/nhóm doanh nghiệp khác nhau | Chỉ thấy/thao tác trong quyền; đã đọc độc lập theo user |
| Job chạy nhiều lần | Không sinh cảnh báo mở trùng cho cùng lead/rule/đợt |
| Giao việc/ghi nhận rồi reload | Dữ liệu vẫn còn; chưa tự đóng nếu vẫn vi phạm |
| Task hoàn thành nhưng chưa hết vi phạm | Cảnh báo vẫn theo đánh giá BE |
| Cập nhật bằng version cũ | HTTP 409; không ghi đè thay đổi mới |
| Retry cùng requestId | Không tạo hoạt động/công việc trùng |
| Nhắc lại hết hạn | BE kiểm tra lại rule trước khi đưa cảnh báo trở lại |
| Cuối ngày/đầu ngày, event có offset | Hiển thị đúng ngày Việt Nam, không mất/trùng event |
| Mở từ màn lead | Đúng cảnh báo của leadId; không phụ thuộc danh sách summary đã tải |

## 9. Checklist BE phản hồi

- [ ] Chốt A hay B, mốc tính, 72 giờ/ngày lịch, >= hay >, trạng thái loại trừ.
- [ ] Chốt mã rule/entity/severity/status và action/result áp dụng.
- [ ] Gửi response summary + detail thực tế cho rule Lead này, đối chiếu các field mục 3.
- [ ] Xác nhận nguồn tương tác nào đủ dữ liệu và định nghĩa tương tác hợp lệ.
- [ ] Xác nhận API ghi nhận xử lý, đã đọc, lịch sử, nhắc lại và tìm theo leadId.
- [ ] Xác nhận version/conflict/idempotency, quyền và cơ chế BE kiểm tra lại/tự đóng.

Ưu tiên bàn giao: **chốt rule → detail đầy đủ + timeline → ghi nhận/đã đọc → đồng bộ vòng đời và truy vấn theo lead**.
