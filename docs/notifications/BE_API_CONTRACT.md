# API cảnh báo ERP: payload và response gửi BE

Ngày bản đề xuất: 12/10/2026.

**Cập nhật contract BE xác nhận ngày 13/10/2026:** tạo việc dùng `POST /api/calendar/alert-task`; lấy việc từng cảnh báo dùng `GET /api/alert-task/{alertId}`; bỏ qua/phê duyệt/hoàn tác dùng `POST /api/notification/action` với action `IGNORE`/`APPROVE`/`UNDO`. `reason` của IGNORE không bắt buộc; UNDO dùng expectedVersion, không dùng undoToken. OwnerId của task truyền dạng string. Các mục tương ứng bên dưới là bản đề xuất cũ, được thay bằng contract xác nhận này. Response và các API khác chưa được BE xác nhận. Phạm vi: chuông cảnh báo trên Header, Trung tâm cảnh báo, drawer chi tiết, giao việc, bỏ qua/hoàn tác, nhắc lại, modal xử lý, tệp/ghi âm và công việc liên quan.

## 1. Hiện trạng và phạm vi

Đã có và FE đang gọi:

```http
GET /api/erp/notification/summary/closed-high
```

Response hiện có: `{errorCode,message,success,data:{statusClose:[],severityHight:[]}}`. Mỗi nhóm chứa `{type,typeLabel,total,alerts:[]}`. Giữ tên `severityHight` đang có để tương thích.

Các thao tác còn lại hiện chỉ sửa state FE, chưa gọi API ghi. Tài liệu này đề xuất contract cho BE bổ sung; các endpoint mới bên dưới chưa được xác nhận tồn tại trên server. Tất cả API ghi dùng POST, không dùng PUT.

Source đối chiếu: `src/layouts/Header/NotificationDropdown.js`, `src/hooks/useNotifications.js`, `src/features/Alerts/model.js`, `service.js`, `rules.js`. Danh mục ERP_ALERT_RULES có 36 mã, đính kèm ở cuối tài liệu.

Đường dẫn trong tài liệu là HTTP đầy đủ `/api/...`. Khi gọi qua RequestUtils, FE dùng `/erp/...` vì client đã cấu hình base `/api`.

## 2. Quy ước dùng chung

### 2.1 Phiên, phân quyền và thời gian

- Authorization lấy từ phiên đăng nhập. BE lấy bizId, actor userId và quyền từ token/context; không tin bizId/actor/role được FE tự truyền.
- Kiểm tra quyền nhìn cảnh báo, quyền thao tác, quyền gán owner, quyền phê duyệt và quyền xem entity/tệp. Không lấy được cảnh báo doanh nghiệp khác dù biết UUID.
- ID cảnh báo là UUID/string của BE; ID user/entity/task giữ đúng kiểu dữ liệu hệ thống, không dùng tên người làm khóa.
- Đề xuất thời gian JSON ISO 8601 UTC, ví dụ `2026-10-12T07:00:00Z` = 14:00 ngày 12/10/2026 tại Việt Nam. `dueAt: null` nghĩa chưa có hạn, không phải quá hạn. FE hiện đọc được ISO/string date và Unix seconds ở response cũ; endpoint mới nên thống nhất ISO.
- Các giờ làm việc trong ERP_ALERT_RULES cần BE dùng lịch làm việc/múi giờ doanh nghiệp. Không thay “2h làm việc” bằng 2h liên tục ngoài ca.
- success: HTTP 200/201 và envelope `{errorCode:200,message,success:true,data}`. Lỗi dùng HTTP 400/401/403/404/409/422 phù hợp, `success:false`; không trả success cho thao tác chưa lưu xong.

### 2.2 Version và chống gửi trùng

Các API thay đổi cảnh báo dùng `expectedVersion` của alert. BE kiểm tra version trong transaction; thay đổi hợp lệ tăng version. Đánh dấu read không tăng version nghiệp vụ của alert vì read là dữ liệu riêng từng người nhận.

Các API tạo task/resolve/snooze/dismiss/approval/complete nhận header:

```http
Idempotency-Key: 02edb6c4-6e10-4fa3-b2f0-7d0a29cd6b10
```

FE tạo một key cho một lần thao tác; retry request đó dùng lại key. BE lưu kết quả theo doanh nghiệp + actor + endpoint + key: cùng key/cùng payload trả kết quả cũ, khác payload trả 409. Không tạo thêm task, không tăng snoozeCount lần nữa khi retry. Version check và idempotency phải xử lý cùng nhau, retry thành công không bị 409 chỉ vì version đã tăng bởi request đó.

### 2.3 Severity và trạng thái

Severity: `CRITICAL`, `HIGH`, `MEDIUM`, `INFO`.

| BE đề xuất | UI hiện tại | Ý nghĩa |
|---|---|---|
| OPEN | Chưa xử lý | Cảnh báo đang mở |
| IN_PROGRESS | Đã tạo việc | Đang có công việc xử lý chính |
| SNOOZED | Đang theo dõi | Tạm hoãn đến snoozedUntil |
| CLOSED | Đã xử lý | Đóng do xử lý hoặc điều kiện nghiệp vụ đã giải quyết |
| DISMISSED | Đã bỏ qua | Người có quyền bỏ qua có lý do |

FE hiện hỗ trợ thêm alias CLOSED/RESOLVED/DONE, DISMISSED/IGNORED, TASK_CREATED; BE chốt một enum chính để tránh nhiều tên cho cùng trạng thái. Read/unread độc lập với status.

Chuyển trạng thái: OPEN → IN_PROGRESS khi giao việc; OPEN/IN_PROGRESS → SNOOZED khi nhắc; đến hạn hoãn trở về trạng thái trước hoãn nếu rule vẫn còn hiệu lực (BE nên lưu `statusBeforeSnooze`); nếu đã giải quyết thì đóng, không đánh thức lại. Xử lý hợp lệ → CLOSED; bỏ qua hợp lệ → DISMISSED. Hoàn tác chỉ khôi phục đúng lần dismiss vừa thực hiện, không ghi đè thay đổi mới.

## 3. Danh sách endpoint

| Method | Endpoint `/api/erp/notification` + suffix | Tình trạng / chức năng |
|---|---|---|
| GET | `/summary/closed-high` | Đã có; bổ sung dữ liệu cho đủ 4 nhóm |
| POST | `/search` | Mới: Trung tâm cảnh báo có filter/phân trang |
| GET | `/detail?id=...` | Mới: drawer chi tiết, quyền, lịch sử |
| POST | `/read` | Mới: đánh dấu một/vài cảnh báo đã xem |
| POST | `/read-all` | Mới: đánh dấu đã xem theo phạm vi |
| POST | `/assign-task` | Mới: tạo việc xử lý từ cảnh báo |
| POST | `/dismiss` | Mới: bỏ qua có lý do |
| POST | `/dismiss/undo` | Mới: hoàn tác trong 5 giây |
| POST | `/snooze` | Mới: đặt giờ nhắc lại |
| POST | `/resolve` | Mới: lưu chi tiết xử lý và follow-up |
| GET | `/tasks?status=OPEN&page=0&limit=20` | Mới hoặc adapter từ works: việc liên quan cảnh báo |
| POST | `/tasks/complete` | Mới hoặc service works: hoàn thành việc |
| POST | `/dismiss-approval/request` | Mới: yêu cầu quản lý duyệt bỏ qua CRITICAL |
| POST | `/dismiss-approval/decision` | Mới: quản lý duyệt/từ chối |

Không tạo một hệ thống task thứ hai nếu BE đã có works. `/assign-task`, `/resolve` và `/tasks/complete` là facade/transaction liên kết notification với công việc thật của ERP. Source hiện có `GET /api/works/fetch`, `POST /api/works/save`; cần BE xác nhận các field works chính xác trước khi map.

## 4. Alert DTO chuẩn

Response summary/search/detail và action nên dùng cùng Alert DTO. Với response action, `data.alert` trả đầy đủ DTO cập nhật; FE thay bản ghi theo id, không đoán trạng thái từ payload.

```json
{
  "id": "1f1c1372-86f4-6aff-8401-65bdbab83cde",
  "version": 3,
  "type": "LEAD_NO_FIRST_CONTACT",
  "typeLabel": "Lead chưa được liên hệ lần đầu",
  "title": "Lead đã giao nhưng chưa được liên hệ",
  "description": "Trần văn hùng đã được giao hơn 24 giờ nhưng chưa có lần liên hệ đầu tiên.",
  "severity": "HIGH",
  "status": "OPEN",
  "entity": {"id": 75, "kind": "LEAD", "name": "Trần văn hùng", "code": "LEAD-75"},
  "ownerId": 2,
  "ownerName": "Administrator",
  "recipientGroup": "Sale phụ trách",
  "dueAt": null,
  "createdDate": "2026-10-06T03:36:47Z",
  "updatedDate": "2026-10-12T01:43:01Z",
  "triggeredAt": "2026-10-12T03:00:00Z",
  "read": false,
  "readAt": null,
  "snoozedUntil": null,
  "snoozeCount": 0,
  "escalatedTo": null,
  "dismissReason": null,
  "taskIds": [],
  "activeTaskId": null,
  "context": [
    {"key":"assignedAt", "format":"date", "value":"2026-10-06T03:36:47Z", "label":"Thời điểm tiếp nhận"}
  ],
  "rule": {
    "id": "LEAD_NO_FIRST_CONTACT_24H",
    "type": "LEAD_NO_FIRST_CONTACT",
    "name": "Lead đã giao quá 24 giờ chưa liên hệ",
    "description": "Đã gán quá 24 giờ, chưa có activity",
    "parameters": {"hours":24},
    "autoClose": "Có activity đầu tiên",
    "conditions": [
      {"key":"assigned", "label":"Lead đã được giao", "actual":true, "expected":true, "operator":"EQUALS", "matched":true},
      {"key":"hoursWithoutActivity", "label":"Giờ chưa liên hệ", "actual":25, "expected":24, "operator":"GREATER_THAN", "matched":true}
    ]
  },
  "suggestedAction": {"code":"CONTACT_CUSTOMER", "label":"Liên hệ lead", "hint":"Liên hệ và cập nhật kết quả chăm sóc."},
  "blocksBusiness": false,
  "blockedOperations": [],
  "permissions": {"canRead":true, "canAssign":true, "canSnooze":true, "canDismiss":true, "requiresDismissApproval":false, "canResolve":true},
  "links": {"entity":{"kind":"LEAD", "id":75}, "conversationId":null},
  "latestRecording": null
}
```

- `read/readAt` là của người đang đăng nhập; user A xem không đánh dấu user B đã xem.
- Ưu tiên object `entity/context/rule/suggestedAction/taskIds`; response cũ có `*Json` vẫn được FE đọc dự phòng. Hai dạng nếu cùng trả phải khớp nhau.
- `type` là mã loại trong ERP_ALERT_RULES; `rule.id` là mã instance/config của rule, có thể chứa hậu tố ngưỡng. FE lookup theo type, không đoán bằng title hay hậu tố rule.id.
- `conditions.actual` là dữ liệu thực tế, `parameters` là cấu hình đang áp dụng, khác với default gợi ý của FE.
- `ownerName` cần trả đủ; không bắt FE tra tên từng alert. Null khi thật sự chưa có phụ trách.
- `context.format` đề xuất text/number/date/currency; currency trả thêm `currency`, value là số. Không dùng string tiền đã format để tính toán.
- `permissions` chỉ hỗ trợ UI; BE vẫn kiểm tra lại mọi request.
- `links` trả ID/kind hoặc URL nội bộ đã allowlist, không đưa JS/script tùy ý. FE map route hiện có để mở hội thoại/hồ sơ trong tab/panel khác, giữ dữ liệu modal đang nhập. Chưa có conversation/recording thì trả null.
- `latestRecording` nếu có: `{id,callId,fileId,recordedAt,durationSeconds}`; chỉ trả recording người dùng được phép đọc.

Detail bổ sung `history`, `resolution`, `tasks`, `attachments`, `dismissApproval`; danh sách có thể bỏ các collection dài.

## 5. API đọc

### 5.1 Summary: giữ endpoint hiện có, bổ sung đầy đủ nhóm

```json
{
  "errorCode":200,
  "message":"success",
  "success":true,
  "data":{
    "snapshotAt":"2026-10-12T03:00:00Z",
    "counts":{"urgent":1,"high":4,"watch":5,"closed":2,"unread":3,"openTasks":1},
    "urgent":[{"type":"MATERIAL_SHORTAGE","typeLabel":"Thiếu nguyên vật liệu","total":1,"alerts":[]}],
    "severityHight":[{"type":"LEAD_NO_FIRST_CONTACT","typeLabel":"Lead chưa liên hệ lần đầu","total":4,"alerts":[]}],
    "watch":[{"type":"MATERIAL_SHORTAGE","typeLabel":"Thiếu nguyên vật liệu","total":1,"alerts":[]}],
    "statusClose":[{"type":"CUSTOMER_NO_ACTIVITY","typeLabel":"Khách chưa được chăm sóc","total":2,"alerts":[]}]
  }
}
```

Ví dụ trên minh họa skeleton nhóm; BE điền Alert DTO vào `alerts`. Nếu giới hạn preview, `total`/counts là tổng thật của query trên server, mảng preview có thể ngắn hơn. Không dùng `alerts.length` thay tổng khi phân trang/giới hạn preview. Danh sách rỗng thật trả total/count=0.

Định nghĩa nhóm theo UI hiện tại (có giao nhau):

- urgent: chưa CLOSED/DISMISSED, không SNOOZED, và CRITICAL hoặc đã escalated hoặc dueAt thực sự quá hạn.
- high: chưa CLOSED/DISMISSED và severity HIGH; gồm cả SNOOZED theo cách nhóm hiện tại.
- watch: tất cả chưa CLOSED/DISMISSED, không chỉ SNOOZED.
- closed: CLOSED và DISMISSED.
- Badge đỏ đếm urgent, chấm xanh là chưa xem. Không cộng 4 nhóm vì một alert có thể xuất hiện ở nhiều nhóm. Dedupe theo alert.id.
- Counts của người đang đăng nhập theo scope được phép nhìn, không phải tổng toàn doanh nghiệp.

FE hiện chỉ đọc severityHight/statusClose và tính counts từ các dòng nhận được. Sau khi BE thêm urgent/watch/counts, FE cần adapter để đọc đầy đủ và dùng counts server. Nếu không bổ sung, CRITICAL/MEDIUM/INFO có thể không xuất hiện dù UI có 4 nhóm.

### 5.2 Search cho Trung tâm cảnh báo

```http
POST /api/erp/notification/search
```

```json
{
  "bucket":"HIGH",
  "keyword":"Trần văn hùng",
  "types":["LEAD_NO_FIRST_CONTACT"],
  "severities":[],
  "statuses":[],
  "ownerIds":[],
  "read":null,
  "entityKind":null,
  "entityId":null,
  "from":null,
  "to":null,
  "page":0,
  "limit":20,
  "sort":{"field":"triggeredAt","descending":true}
}
```

Bucket: ALL/URGENT/HIGH/WATCH/CLOSED. Điều kiện filter bổ sung kết hợp AND; keyword tìm title/description/entity name/code. from/to lọc triggeredAt, from bao gồm/to không bao gồm; server chỉ nhận sort field allowlist. Page bắt đầu 0.

Response `data:{content:[AlertDTO...],pageInfo:{page:0,limit:20,total:4,totalPages:1},snapshotAt:"..."}`.

### 5.3 Detail

```http
GET /api/erp/notification/detail?id=1f1c1372-86f4-6aff-8401-65bdbab83cde
```

Response `data` là Alert DTO đầy đủ, bổ sung:

```json
{
  "history":[{"id":"EVT-101","action":"TRIGGERED","actorId":null,"actorName":"Hệ thống","text":"Hệ thống kích hoạt cảnh báo","at":"2026-10-12T03:00:00Z"}],
  "resolution":null,
  "tasks":[],
  "attachments":[],
  "dismissApproval":null
}
```

Đây là phần bổ sung DTO, không phải toàn bộ detail response. GET detail không tự đánh dấu đã xem; FE gọi read khi mở alert. Lịch sử gồm trigger, read của người dùng phù hợp quyền, assign, snooze, escalation, approval, dismiss/undo, resolve, auto-close, task completion. BE lưu timestamp và actor thật.

## 6. Đánh dấu đã xem

### 6.1 Read

```http
POST /api/erp/notification/read
```

```json
{"alertIds":["1f1c1372-86f4-6aff-8401-65bdbab83cde"]}
```

Response:

```json
{"errorCode":200,"message":"Đã đánh dấu đã xem","success":true,"data":{"alertIds":["1f1c1372-86f4-6aff-8401-65bdbab83cde"],"readAt":"2026-10-12T03:10:00Z","unreadCount":2}}
```

Lặp lại read là idempotent, không đổi status, không spam audit lần đọc cũ. Không cho read alert ngoài scope; batch validate toàn bộ trước khi ghi.

### 6.2 Read all

```http
POST /api/erp/notification/read-all
```

```json
{"scope":"ALL_RECEIVED","before":"2026-10-12T03:00:00Z"}
```

`before` dùng snapshotAt từ summary: chỉ đánh dấu alert đã nhận trước/đúng snapshot, không đánh dấu các alert mới đến mà user chưa được thấy. ALL_RECEIVED áp dụng inbox/scopes được phép nhìn của user hiện tại, không read hộ người nhận khác. Response `data:{affected:3,readAt:"...",unreadCount:0}`; unreadCount có thể >0 nếu có alert mới đến sau snapshot.

## 7. Giao việc từ cảnh báo

```http
POST /api/erp/notification/assign-task
```

```json
{
  "alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde",
  "expectedVersion":3,
  "task":{
    "title":"Liên hệ Trần văn hùng",
    "ownerId":2,
    "dueAt":"2026-10-12T07:00:00Z",
    "priority":"HIGH",
    "description":"Liên hệ lần đầu và cập nhật kết quả chăm sóc."
  }
}
```

Validate title.trim/ownerId/dueAt bắt buộc, dueAt trong tương lai theo giờ server, owner thuộc doanh nghiệp và actor có quyền gán. BE lấy entity/ref từ alert; không tin entity do FE gửi. Không tạo trùng việc xử lý chính đang mở cho alert: 409 ACTIVE_TASK_EXISTS, trả activeTaskId.

Ghi task thật vào works, liên kết alertId/entity và chuyển alert IN_PROGRESS trong cùng transaction. BE trả `data:{alert:AlertDTO,task:TaskDTO}`. Task DTO:

```json
{
  "id":501,
  "version":1,
  "alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde",
  "kind":"ALERT_ACTION",
  "title":"Liên hệ Trần văn hùng",
  "ownerId":2,
  "ownerName":"Administrator",
  "dueAt":"2026-10-12T07:00:00Z",
  "priority":"HIGH",
  "status":"OPEN",
  "entity":{"kind":"LEAD","id":75,"name":"Trần văn hùng"},
  "autoCloseAlert":true,
  "createdAt":"2026-10-12T03:10:00Z"
}
```

FE hiện Select người phụ trách dùng tên mock OWNERS; khi nối API phải dùng danh sách user thật và value ownerId, không gửi ownerName thay ID.

## 8. Bỏ qua, phê duyệt và hoàn tác

### 8.1 Dismiss

```http
POST /api/erp/notification/dismiss
```

```json
{
  "alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde",
  "expectedVersion":3,
  "reasonCode":"HANDLED_ELSEWHERE",
  "reasonText":"Đã liên hệ và xử lý qua điện thoại.",
  "approvalId":null
}
```

Reason codes: HANDLED_ELSEWHERE, NO_LONGER_NEEDED, INVALID_OR_DUPLICATE, OTHER. Code bắt buộc thuộc allowlist; OTHER bắt buộc reasonText.trim. UI gửi code ổn định, không dùng câu tiếng Việt làm enum.

CRITICAL cần phê duyệt theo policy: user có quyền phê duyệt trực tiếp hoặc approvalId APPROVED đúng alert/requester/version. Không nhận boolean `approved:true` từ FE làm bằng chứng. Checkbox mô phỏng quản lý đồng ý hiện tại phải được thay bằng flow phê duyệt thật.

Thành công → DISMISSED, audit reason/actor, response `data:{alert:AlertDTO,undoToken:"opaque-token",undoExpiresAt:"2026-10-12T03:10:05Z"}`. Token ngẫu nhiên gắn đúng actor, alert và event dismiss, sống 5 giây theo server. Token không phải JWT phiên đăng nhập.

### 8.2 Undo

```http
POST /api/erp/notification/dismiss/undo
```

```json
{"alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde","undoToken":"opaque-token"}
```

Server kiểm tra còn hạn, đúng actor/doanh nghiệp/event và chưa có thay đổi nghiệp vụ mới sau dismiss. Khôi phục trạng thái hợp lệ trước dismiss, thêm audit UNDO_DISMISS. Nếu rule đã hết hiệu lực không mở lại cảnh báo vô nghĩa; trả 409 và trạng thái hiện tại. Không nhận snapshot nguyên alert từ FE để ghi đè. Response `data:{alert:AlertDTO}`; token đã dùng lần nữa trả cùng kết quả nếu không có event mới, không lặp audit.

### 8.3 Xin duyệt và quyết định

```http
POST /api/erp/notification/dismiss-approval/request
```

```json
{"alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde","expectedVersion":3,"reasonCode":"OTHER","reasonText":"Cảnh báo đang bị trùng với hồ sơ đã xử lý."}
```

BE tự xác định quản lý/người duyệt theo doanh nghiệp. Response `data:{approval:{id:901,status:"PENDING",alertId:"...",requestedBy:2,approverIds:[19],requestedAt:"..."}}`; chưa chuyển DISMISSED. Approval được trả lại trong detail để FE theo dõi.

```http
POST /api/erp/notification/dismiss-approval/decision
```

```json
{"approvalId":901,"decision":"APPROVE","comment":"Đồng ý bỏ qua cảnh báo trùng."}
```

Decision APPROVE/REJECT; actor phải có quyền và là approver hợp lệ. Response approval APPROVED/REJECTED. Sau APPROVED, requester gọi dismiss với approvalId; lý do phải khớp approval, BE recheck version và trạng thái. Nếu đã có workflow phê duyệt chung, dùng chung service thay vì tạo cơ chế riêng.

## 9. Nhắc lại

```http
POST /api/erp/notification/snooze
```

```json
{"alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde","expectedVersion":3,"until":"2026-10-12T07:00:00Z"}
```

FE đổi các lựa chọn “1 giờ nữa”, “14:00 gần nhất”, “sáng mai 08:00”, “thứ 2 tuần sau” hoặc giờ tùy chỉnh thành timestamp cụ thể. BE chỉ cần validate until > now, alert đang mở và actor có quyền. Không nhận snoozeCount/escalatedTo từ FE.

BE chuyển SNOOZED, tăng snoozeCount đúng một lần, lưu audit. Từ lần thứ 3 kích hoạt theo policy ALERT_SNOOZE_ABUSE, đưa quản lý vào theo dõi; trả escalatedTo thật. Response `data:{alert:AlertDTO}`.

BE scheduler/event xử lý đến hạn kể cả browser đóng: kiểm tra rule còn hiệu lực, khôi phục OPEN/IN_PROGRESS hoặc auto-close, phát sự kiện/đặt read=false theo policy người nhận của lần nhắc. Không dựa vào timer 15 giây FE để vận hành production. Metadata escalation không tự tạo task nếu chưa có nghiệp vụ rõ.

## 10. Lưu chi tiết xử lý

```http
POST /api/erp/notification/resolve
```

```json
{
  "alertId":"1f1c1372-86f4-6aff-8401-65bdbab83cde",
  "expectedVersion":3,
  "activityCode":"CONTACT_CUSTOMER",
  "activityLabel":"Gọi hỏi thăm khách",
  "resultCode":"STILL_INTERESTED",
  "notes":"Đã gọi 4 phút. Khách vẫn quan tâm, đề nghị gửi lại báo giá trước thứ 6.",
  "attachmentIds":[801],
  "recordingId":701,
  "followUp":{
    "title":"Theo dõi Trần văn hùng",
    "ownerId":2,
    "dueAt":"2026-10-13T02:00:00Z",
    "priority":"HIGH"
  }
}
```

- activityCode là mã suggestedAction hoặc mã hành động chi tiết allowlist; activityLabel chỉ để hiển thị, không thay code. Nếu cần phân biệt CALL_CUSTOMER/SEND_ZALO/RESEND_QUOTE/MEET_CUSTOMER/OTHER, BE và FE thống nhất allowlist; OTHER cần ghi chú rõ.
- Result cho nhóm khách: STILL_INTERESTED, CONTACT_LATER, UNREACHABLE, NO_LONGER_NEEDED. Nhóm sản xuất/kho/meta: COMPLETED, FOLLOW_UP_REQUIRED, UNABLE_TO_RESOLVE. BE validate code phù hợp rule/entity, không dùng label tiếng Việt làm giá trị enum.
- notes.trim bắt buộc; giữ newline. attachmentIds chỉ dùng ID tệp đã upload và đủ quyền. recordingId có thể null, chỉ gắn ghi âm hợp lệ thuộc call/entity có quyền.
- Không có follow-up gửi `followUp:null`; nếu có, title/ownerId/dueAt bắt buộc, dueAt tương lai.
- BE lưu resolution, activity nghiệp vụ liên quan và audit trong transaction. Với rule “có activity mới”, activity được ghi thật để rule engine cập nhật, không chỉ append text lịch sử noti.
- Với hành động tạo LSX/PO, duyệt báo giá/công nợ, nhận cọc, upload POD…, ghi chú không thay thế nghiệp vụ thật. BE kiểm tra prerequisite trước khi đóng; nếu chưa đủ trả 422 RULE_STILL_MATCHED, không ghi success/không gỡ chặn chỉ vì FE bấm “Xong”.
- Follow-up tạo task kind FOLLOW_UP, autoCloseAlert=false; việc theo dõi không mở lại cảnh báo vừa đóng. Không đánh dấu mọi task liên quan hoàn thành mù; chỉ kết thúc việc xử lý chính theo policy và giữ việc độc lập.

Response `data:{alert:AlertDTO,resolution:ResolutionDTO,followUpTask:TaskDTO|null,activityId:123}`. Resolution DTO gồm id, activityCode/label, resultCode, notes, attachments đã hydrate, recording, actorId/name, resolvedAt.

Đề xuất xử lý duplicate/failure theo idempotency: retry không tạo hai activity hoặc hai follow-up. Upload tệp trước, nếu resolve thất bại giữ file draft để retry hoặc dọn theo TTL; không đóng modal và báo thành công trước khi API hoàn tất.

## 11. Tệp, ghi âm, hội thoại và hồ sơ

Source hiện có `POST /api/erp/folder/multiple`, multipart fields `files` (lặp), `folder`; không dùng request JSON chứa `{name,size}` thay cho upload thật. Cần BE xác nhận endpoint này có thể trả/tra fileId ổn định và quyền theo doanh nghiệp cho noti. Nếu chưa có metadata ID, bổ sung adapter/upload contract trả:

```json
{"errorCode":200,"message":"success","success":true,"data":[{"id":801,"name":"bien-ban.pdf","size":128000,"mimeType":"application/pdf","downloadUrl":"/api/erp/folder/file/801"}]}
```

URL trong ví dụ là đề xuất, không khẳng định route download này đã có. Backend validate loại/kích thước/quyền file; FE chỉ gửi attachmentIds trong resolve. Không cấp quyền xem file chỉ dựa trên URL công khai.

Ghi âm cần API/service call hiện có cung cấp ID, fileId và thời điểm; checkbox FE hiện chỉ boolean mock, không phải ghi âm thật. Nếu chưa có service, trả latestRecording=null và chưa bật chức năng gắn ghi âm.

Hội thoại/hồ sơ dùng links từ detail hoặc entity ID để mở module ERP hiện có; các popup hội thoại demo hiện tại cần thay bằng navigation thực. Không cần API notification tạo lại khách hàng/hội thoại.

## 12. Việc liên quan và hoàn thành

```http
GET /api/erp/notification/tasks?status=OPEN&page=0&limit=20
```

Response `data:{content:[TaskDTO...],pageInfo:{page:0,limit:20,total:1,totalPages:1}}`; include loại ALERT_ACTION/FOLLOW_UP và entity/alertId để mở đúng drawer. Có thể thêm alertId để lọc việc của một cảnh báo. Người dùng chỉ thấy việc được phép nhìn; counts openTasks cùng scope.

```http
POST /api/erp/notification/tasks/complete
```

```json
{"taskId":501,"expectedVersion":1,"notes":"Đã liên hệ và cập nhật hồ sơ lead."}
```

BE cập nhật works thật, audit và re-evaluate rule. Khi autoCloseAlert=true, việc xử lý đã hoàn thành và điều kiện đóng hợp lệ, tự đóng alert; response `data:{task:TaskDTO,alert:AlertDTO|null,alertClosed:true}`. Nếu task hoàn thành nhưng rule nghiệp vụ chưa được giải quyết, trả task DONE và alert vẫn mở, alertClosed=false, kèm closePendingReason. FOLLOW_UP không tự đóng alert khác.

Task hoàn thành qua `/works/save` hoặc màn công việc khác cũng phải đi qua service/event liên kết để noti cập nhật, không chỉ khi dùng nút “Hoàn thành” trong dropdown. Không tạo trùng ALERT_RULES TASK_OVERDUE theo mỗi lần scan.

## 13. Lỗi mẫu

```json
{
  "errorCode":409,
  "message":"Cảnh báo đã thay đổi. Vui lòng tải lại trước khi thao tác.",
  "success":false,
  "data":null,
  "error":{"code":"VERSION_CONFLICT","fieldErrors":[],"currentVersion":4}
}
```

| HTTP | error.code | Khi nào |
|---|---|---|
| 400 | VALIDATION_ERROR | Payload sai, reason/result/priority không thuộc allowlist |
| 401 | UNAUTHENTICATED | Phiên hết hạn |
| 403 | FORBIDDEN / APPROVAL_REQUIRED | Không đủ quyền / cần quản lý duyệt |
| 404 | ALERT_NOT_FOUND / TASK_NOT_FOUND | Không tồn tại hoặc ngoài scope theo chính sách tránh lộ ID |
| 409 | VERSION_CONFLICT | Có người khác thay đổi |
| 409 | ACTIVE_TASK_EXISTS | Đã có việc xử lý chính đang mở |
| 409 | UNDO_EXPIRED / UNDO_CONFLICT | Hết 5 giây hoặc bản ghi đã đổi |
| 409 | IDEMPOTENCY_CONFLICT | Dùng lại key cho payload khác |
| 422 | RULE_STILL_MATCHED | Chưa đủ điều kiện đóng/gỡ chặn |
| 422 | INVALID_ATTACHMENT / INVALID_RECORDING | Tệp/ghi âm không hợp lệ hoặc không thuộc scope |

Validation trả `fieldErrors:[{field:"task.dueAt",message:"Hạn phải trong tương lai"}]`. FE giữ dữ liệu modal để sửa/retry, không mất notes hoặc file đã chọn.

## 14. Rule engine và dữ liệu bổ sung cần BE chốt

- BE thực thi ERP_ALERT_RULES, dedupe theo bizId + type + entity + chu kỳ cảnh báo, re-evaluate khi nghiệp vụ thay đổi. Không sinh alert mới mỗi lần gọi summary hoặc mở chuông.
- Ngưỡng trong bảng là đề xuất; BE/nghiệp vụ chốt. Severity của INVOICE_OVERDUE phân tầng MEDIUM/HIGH/CRITICAL theo số ngày thực tế; FE ưu tiên severity server, không dùng default MEDIUM để thay giá trị HIGH/CRITICAL.
- BE xác định owner/recipients theo vai trò thực tế, manager/escalation, dueAt, actual values, permissions. Read/unread lưu riêng mỗi recipient.
- Chặn nghiệp vụ phải được kiểm tra trong API thực hiện nghiệp vụ liên quan. DISMISSED/SNOOZED/read không tự bỏ chặn tài chính/chất lượng. Muốn ngoại lệ phải có approval thực và audit.
- Meta TASK_OVERDUE, ALERT_SNOOZE_ABUSE, ALERT_UNACKED xử lý bằng scheduler/event BE và tránh tạo chuỗi escalation vô hạn.
- Sau khi action thành công, FE cập nhật từ response rồi refresh summary/tasks. Mất mạng không báo success; retry idempotent. Đổi doanh nghiệp hủy/bỏ response phiên cũ.

FE cần sửa tiếp khi contract đã thống nhất: thay local applyAction bằng async APIs, đọc server counts/urgent/watch/read/history/permissions, dùng userId thật, upload/recording ID thật, await success trước khi đóng UI và bỏ checkbox phê duyệt mock. Nội dung này là yêu cầu tích hợp tiếp, chưa được triển khai bằng tài liệu này.

## 15. Các case nghiệm thu tối thiểu

1. HIGH, CRITICAL, MEDIUM, INFO và CLOSED/DISMISSED xuất hiện đúng nhóm; cùng alert không nhân số lượng; counts đúng dù preview chỉ trả vài dòng.
2. User A read không làm user B read; dueAt null không bị đánh dấu quá hạn; read-all không read alert mới sau snapshot.
3. Double-click/retry assign tạo đúng một works; retry snooze không tăng count lần thứ hai; version conflict không ghi đè.
4. Snooze đến giờ khi trình duyệt đóng vẫn được xử lý; lần 3 escalated thật; cảnh báo đã giải quyết không bị bật lại.
5. CRITICAL không thể bỏ qua bằng approved=true giả; approval đúng quyền; undo hết hạn/đã đổi không ghi đè.
6. Resolve giữ notes nhiều dòng, file/ghi âm đúng quyền, follow-up tạo đúng một task; task follow-up không làm thay đổi cảnh báo đã đóng.
7. Task hoàn thành từ màn works vẫn cập nhật alert; rule chặn chưa giải quyết không bị gỡ bằng một ghi chú.
8. Các POST/action và file không truy cập được doanh nghiệp khác; malformed payload/date/enum trả lỗi rõ.

## 16. Danh mục ERP_ALERT_RULES

Bảng dưới sao từ danh mục FE đã đối chiếu file nghiệp vụ. Parameters là giá trị đề xuất, không phải cấu hình BE đã xác nhận. `suggestedAction` dùng mã ổn định, FE tra nhãn tiếng Việt.

| Type | Giai đoạn / tên | Entity | Điều kiện | Tham số | Mức độ | Người nhận | suggestedAction | Tự đóng khi | Chặn |
|---|---|---|---|---|---|---|---|---|---|
| LEAD_NOT_ASSIGNED | Lead / Lead chưa gán sale | LEAD | Lead mới > {hours}h làm việc chưa gán sale | hours=2 | HIGH | Trưởng nhóm sale | ASSIGN_OWNER | Đã gán owner | Không |
| LEAD_NO_FIRST_CONTACT | Lead / Lead chưa liên hệ lần đầu | LEAD | Đã gán > {hours}h, chưa có activity | hours=24 | HIGH | Sale phụ trách | CONTACT_CUSTOMER | Có activity đầu tiên | Không |
| LEAD_STALE | Lead / Lead ngưng hoạt động | LEAD | Không hoạt động > {days} ngày, chưa chuyển cơ hội | days=7 | MEDIUM | Sale phụ trách | CONTACT_CUSTOMER | Có activity mới hoặc lead đóng | Không |
| LEAD_DUPLICATE | Lead / Lead trùng | LEAD | Trùng SĐT / email / MST với lead hoặc khách đã có | — | INFO | Sale phụ trách | MERGE_LEAD | Đã merge hoặc đánh dấu không trùng | Không |
| CUSTOMER_NO_ACTIVITY | Lead / Khách chưa được chăm sóc | CUSTOMER | Khách Active > {days} ngày không hoạt động | days=7 | HIGH | Sale phụ trách | CONTACT_CUSTOMER | Có activity mới | Không |
| DEAL_STAGE_STUCK | Cơ hội / Báo giá / Cơ hội kẹt stage | DEAL | Nằm ở một stage quá {days} ngày (ngưỡng theo stage) | days=theo stage | MEDIUM | Sale phụ trách | ADVANCE_STAGE | Chuyển stage | Không |
| DEAL_HIGH_VALUE_IDLE | Cơ hội / Báo giá / Cơ hội giá trị lớn không hoạt động | DEAL | Giá trị ≥ {value} và {days} ngày không hoạt động | value=300000000; days=3 | CRITICAL | Sale + Manager | CONTACT_CUSTOMER | Có activity mới | Không |
| DEAL_CLOSE_DATE_PASSED | Cơ hội / Báo giá / Quá ngày dự kiến chốt | DEAL | Quá ngày dự kiến chốt, chưa Won/Lost | — | HIGH | Sale phụ trách | UPDATE_CLOSE_DATE | Cập nhật ngày chốt hoặc đóng deal | Không |
| QUOTE_NO_FOLLOWUP | Cơ hội / Báo giá / Báo giá chưa follow-up | QUOTE | Báo giá đã gửi > {days} ngày, khách chưa phản hồi | days=3 | HIGH | Sale phụ trách | FOLLOW_UP_QUOTE | Có phản hồi hoặc activity | Không |
| QUOTE_EXPIRING | Cơ hội / Báo giá / Báo giá sắp hết hiệu lực | QUOTE | Hết hiệu lực trong ≤ {days} ngày | days=2 | MEDIUM | Sale phụ trách | EXTEND_QUOTE | Gia hạn, chốt hoặc hết hạn | Không |
| QUOTE_LOW_MARGIN | Cơ hội / Báo giá / Báo giá biên lợi nhuận thấp | QUOTE | Biên lợi nhuận < {margin} | margin=15% | HIGH | Manager (người duyệt) | APPROVE_QUOTE | Duyệt hoặc từ chối | Có |
| QUOTE_PENDING_APPROVAL | Cơ hội / Báo giá / Báo giá chờ duyệt lâu | QUOTE | Chờ duyệt > {hours}h làm việc | hours=8 | MEDIUM | Người duyệt | APPROVE_QUOTE | Đã duyệt | Không |
| ORDER_PENDING_CONFIRM | Đơn hàng & công nợ / Đơn chưa xác nhận | ORDER | Đơn tạo > {hours}h chưa xác nhận | hours=24 | HIGH | Sale / Admin đơn | CONFIRM_ORDER | Đã xác nhận | Không |
| ORDER_DEPOSIT_MISSING | Đơn hàng & công nợ / Đơn chưa nhận cọc | ORDER | Đơn yêu cầu cọc, quá {days} ngày chưa nhận | days=3 | HIGH | Sale + Kế toán | REQUEST_DEPOSIT | Đã ghi nhận cọc | Có |
| ORDER_CREDIT_EXCEEDED | Đơn hàng & công nợ / Vượt hạn mức công nợ | ORDER | Đơn mới làm khách vượt hạn mức công nợ | — | CRITICAL | Kế toán + Manager | APPROVE_CREDIT | Duyệt ngoại lệ hoặc đã thu | Có |
| ORDER_NOT_PLANNED | Đơn hàng & công nợ / Đơn chưa lên lệnh SX | ORDER | Đã xác nhận (đủ cọc) > {days} ngày chưa có lệnh SX | days=2 | HIGH | Kế hoạch SX | CREATE_MO | Có lệnh sản xuất | Không |
| ORDER_DELIVERY_AT_RISK | Đơn hàng & công nợ / Nguy cơ trễ giao hàng | ORDER | ETA dự báo từ tiến độ SX > ngày giao đã hứa | — | CRITICAL | Sale + Kế hoạch | NEGOTIATE_DELIVERY | ETA ≤ ngày giao hoặc đã dời ngày giao | Không |
| ORDER_SPEC_CHANGED | Đơn hàng & công nợ / Thay đổi spec khi đang SX | ORDER | Khách đổi spec / số lượng khi lệnh đã chạy | — | HIGH | Kế hoạch + Xưởng | REVIEW_CHANGE | Đã xác nhận thay đổi | Không |
| INVOICE_OVERDUE | Đơn hàng & công nợ / Công nợ quá hạn | INVOICE | Quá hạn: 1 ngày=MEDIUM; 15 ngày=HIGH; 30 ngày=CRITICAL | tiers=1/15/30 | MEDIUM | Sale + Kế toán | COLLECT_DEBT | Thanh toán đủ | Không |
| PROOF_NOT_APPROVED | Sản xuất / Mẫu in chưa được duyệt | ORDER | Mẫu in / maquette chưa duyệt, còn ≤ {days} ngày đến ngày SX | days=2 | HIGH | Sale phụ trách | REQUEST_PROOF_APPROVAL | Khách đã duyệt | Có |
| MATERIAL_SHORTAGE | Sản xuất / Thiếu nguyên vật liệu | MO | Tồn khả dụng theo BOM < nhu cầu, còn ≤ {days} ngày đến ngày SX | days=3 | CRITICAL | Kế hoạch + Mua hàng | CREATE_PO | Đủ vật tư hoặc đã giữ hàng | Không |
| MO_NOT_STARTED | Sản xuất / Lệnh SX chưa bắt đầu | MO | Đến ngày bắt đầu mà lệnh chưa start | — | HIGH | Quản đốc | START_MO | Lệnh đã start | Không |
| MO_BEHIND_SCHEDULE | Sản xuất / Lệnh SX chậm tiến độ | MO | Tiến độ thực tế < kế hoạch {pct} | pct=10% | HIGH | Quản đốc + Kế hoạch | RESCHEDULE_MO | Bắt kịp tiến độ | Không |
| STEP_IDLE | Sản xuất / Công đoạn không cập nhật | MO | Không cập nhật sản lượng > {hours}h trong ca | hours=4 | MEDIUM | Tổ trưởng | UPDATE_PROGRESS | Có cập nhật | Không |
| QC_FAIL_RATE_HIGH | Sản xuất / Tỷ lệ lỗi QC cao | MO | Tỷ lệ lỗi lô / công đoạn > {pct} | pct=3% | CRITICAL | QC + Quản đốc | QC_INVESTIGATE | Đã xử lý NCR | Không |
| MO_OVER_CONSUMPTION | Sản xuất / Vượt định mức vật tư | MO | Vật tư xuất vượt định mức BOM > {pct} | pct=5% | MEDIUM | Kế hoạch + Kho | REVIEW_CONSUMPTION | Đã giải trình | Không |
| STOCK_BELOW_MIN | Kho vận / Tồn dưới mức tối thiểu | ITEM | Tồn < mức tồn tối thiểu | — | MEDIUM | Mua hàng | CREATE_PO | Tồn ≥ min hoặc có PO đang về | Không |
| PO_LATE | Kho vận / Đơn mua về trễ | PO | Quá ngày về dự kiến | — | HIGH | Mua hàng | CONTACT_SUPPLIER | Đã nhập kho hoặc dời ETA | Không |
| FG_NOT_SHIPPED | Kho vận / Thành phẩm tồn chưa xuất | ORDER | Thành phẩm đã nhập kho > {days} ngày chưa xuất | days=3 | MEDIUM | Kho + Sale | SCHEDULE_DELIVERY | Đã xuất kho | Không |
| SHIPMENT_DELAYED | Kho vận / Vận chuyển trễ | SHIPMENT | Vận đơn quá ETA mà chưa giao | — | HIGH | Điều phối + Sale | TRACK_SHIPMENT | Đã giao | Không |
| DELIVERY_NO_POD | Kho vận / Thiếu biên bản giao hàng | SHIPMENT | Đã giao > {hours}h chưa có POD | hours=48 | HIGH | Kho + Kế toán | UPLOAD_POD | Đã có POD | Có |
| STOCK_DISCREPANCY | Kho vận / Lệch kiểm kê | ITEM | Kiểm kê lệch > {pct} hoặc > {value} | pct=2%; value=5000000 | HIGH | Thủ kho + Kế toán | RECONCILE_STOCK | Đã điều chỉnh | Không |
| RETURN_PENDING | Kho vận / Hàng trả về chưa xử lý | RETURN | Hàng trả về > {days} ngày chưa xử lý | days=3 | MEDIUM | Kho + QC | PROCESS_RETURN | Đã xử lý | Không |
| TASK_OVERDUE | Meta / Công việc quá hạn | TASK | Task sinh từ cảnh báo quá dueAt | — | HIGH | Quản lý trực tiếp | ESCALATE | Task hoàn thành | Không |
| ALERT_SNOOZE_ABUSE | Meta / Nhắc lại quá nhiều lần | ALERT | snoozeCount ≥ {n} | n=3 | HIGH | Quản lý trực tiếp | ESCALATE | Đã xử lý cảnh báo gốc | Không |
| ALERT_UNACKED | Meta / Cảnh báo khẩn chưa xử lý | ALERT | Mức CRITICAL để OPEN > {hours}h | hours=4 | CRITICAL | Manager | ESCALATE | Cảnh báo gốc rời OPEN | Không |

Tương thích dữ liệu cũ: response mẫu LEAD_NO_FIRST_CONTACT đang dùng suggestedAction.code CONTACT_LEAD; danh mục quy định CONTACT_CUSTOMER. BE có thể giữ alias CONTACT_LEAD cho lịch sử nhưng nên thống nhất mã chính CONTACT_CUSTOMER và vẫn trả label/hint rõ ràng. Không suy action từ tiêu đề.
