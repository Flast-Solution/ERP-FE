# API dữ liệu và xử lý cho 6 cảnh báo nghiệp vụ

Ngày soạn: 19/10/2026. Đối tượng: BE và FE ERP.

> Đây là đề xuất hợp đồng để hai bên thống nhất, không phải mô tả toàn bộ API đã triển khai. Các response và ID bên dưới là dữ liệu minh họa, không phải dữ liệu khách hàng thật. Tên trường mới, mã cảnh báo mới và endpoint đề xuất cần BE xác nhận trước khi FE tích hợp.

## 1. Kết luận và phạm vi

FE đã có 6 drawer riêng, nhưng chưa đủ dữ liệu/hành động để coi là luồng hoàn chỉnh. Cần chốt: dữ liệu chi tiết nghiệp vụ, timeline khách/sale, lưu kết quả xử lý và đã đọc, POD theo lần giao, cơ chế kiểm tra lại/tự đóng và tìm cảnh báo theo đối tượng.

Không tự lấy ngưỡng trong ảnh thiết kế thay cho quy tắc đang chạy. Không coi dữ liệu thiếu là số 0 hoặc không có tương tác. Không đóng cảnh báo chỉ vì người dùng bấm xử lý hoặc hoàn thành một công việc.

## 2. Hiện trạng tích hợp trong FE

| API/cơ chế | FE đang dùng | Giới hạn cần xác nhận |
|---|---|---|
| `GET /erp/notification/summary/closed-high` | Tải các nhóm cảnh báo | Chưa có hợp đồng truy vấn theo đối tượng/phân trang; không đảm bảo bao phủ mọi bản ghi khi mở từ màn nghiệp vụ |
| `GET /erp/notification/alert/{id}` | Chủ yếu đọc danh sách công việc; có thể đọc `{alert, tasks}` | FE hiện đòi `tasks` là mảng; BE không nên chỉ trả một object alert trần |
| `GET /erp/order/view-on-edit?orderId=...` | Bổ sung đơn/cơ hội | Không thay thế được API chi tiết lead, lệnh SX, lần giao; không đủ để khẳng định đã có toàn bộ timeline/POD |
| `POST /calendar/alert-task` | Giao việc với `expectedVersion` | Cần trả trạng thái/version mới và kiểm soát quyền |
| `POST /notification/action` | `IGNORE`, `REOPEN`, `APPROVE`, `UNDO` | FE đang dùng `REOPEN` kèm `snoozedUntil` để nhắc lại; cần chốt semantics |
| Ghi nhận kết quả xử lý | Chỉ lưu trong bộ nhớ phiên FE | Chưa có API ghi bền vững được nối |
| Đã đọc/đọc tất cả | Chỉ lưu trong bộ nhớ phiên FE | Chưa có API lưu theo user được nối |
| Lịch sử | FE có mốc khởi tạo và hoạt động cục bộ | Chưa có hợp đồng lịch sử đầy đủ từ BE |
| POD | Mở màn giao hàng hiện có | Chưa có hợp đồng API POD chuyên biệt được nối vào drawer |

Các đường dẫn trên ghi theo argument FE gọi, chưa gồm base URL `/api`. Không đổi hàng loạt các API đang chạy chỉ dựa vào tài liệu này; BE cần xác nhận prefix chính thức.

### Chênh lệch mã/quy tắc hiện tại và ảnh thiết kế

| Drawer | Mã/quy tắc trong catalog FE hiện tại | Điểm cần chốt |
|---|---|---|
| Lead 3 ngày chưa ra cơ hội | `LEAD_STALE`: không hoạt động > 7 ngày | 3 ngày hay 7 ngày; tính từ tạo lead hay lần tương tác cuối; điều kiện đồng thời hay độc lập |
| Cơ hội 7 ngày chưa ra đơn | `DEAL_STAGE_STUCK`: nằm ở stage quá ngưỡng theo stage | Kẹt stage không đồng nghĩa chưa ra đơn 7 ngày; cần quy tắc riêng hoặc xác nhận ánh xạ |
| Đơn chưa có lệnh sau 3 ngày | `ORDER_NOT_PLANNED`: đã xác nhận/đủ cọc > 2 ngày | Mốc tạo đơn hay xác nhận; ngưỡng 2 hay 3; đơn lập lệnh một phần xử lý thế nào |
| Hoàn thành nhưng chưa thu đủ | `INVOICE_OVERDUE`, entity `INVOICE`: công nợ quá hạn | Chưa thu đủ không đồng nghĩa quá hạn; đề xuất entity `ORDER` cho drawer này |
| SX còn ≤ 3 ngày | FE có ánh xạ UI cho `PRODUCTION_DUE_SOON`/`MO_DUE_SOON` | BE chốt mã chính thức, hạn theo lệnh hay dòng, và tách sắp hạn khỏi đã trễ |
| Thiếu POD | `DELIVERY_NO_POD`, entity `SHIPMENT`: đã giao > 48 giờ chưa POD | Ảnh dùng quá ngày dự kiến giao chưa POD; đây là điều kiện khác, cần chốt trước |

Trong sample dưới đây dùng mã thể hiện đúng từng mục đích: `LEAD_3_DAY`, `OPPORTUNITY_7_DAY`, `ORDER_NOT_PLANNED`, `ORDER_COMPLETED_UNPAID`, `PRODUCTION_DUE_SOON`, `DELIVERY_NO_POD`. Đây không phải yêu cầu BE tự đổi các rule cũ đang chạy. Nếu chọn mã khác, BE gửi mapping chính thức để FE cập nhật.

## 3. Hợp đồng response chi tiết đề xuất

Mở rộng API chi tiết hiện có, response envelope:

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {},
    "tasks": []
  }
}
```

- `alert.entity`: `{kind, id, code, name}` trỏ đúng đối tượng gây cảnh báo. Mỗi quan hệ khác phải có ID riêng: `orderId`, `orderDetailId`, `productionOrderId`, `shippingHistoryId`… Không dùng code/tên để ghép thay ID.
- `alert.version`: số phiên bản cho mọi mutation; BE kiểm tra `expectedVersion`, xung đột trả HTTP 409 và cho phép FE tải lại.
- `alert.type`, `severity`, `status`, `triggeredAt`, `evaluatedAt`, `dueAt`, `ownerId`, `ownerName`, `read`, `readAt`: metadata nhất quán.
- `alert.rule`: mã, tên, mô tả, tham số và từng giá trị thực tế. Ngày giờ ISO 8601 có offset; mẫu dùng `+07:00`, `timezone: Asia/Ho_Chi_Minh`.
- `alert.businessData`: object có cấu trúc cho drawer, không chỉ chuỗi mô tả. Nếu BE vẫn dùng `contextJson`, có thể đặt cùng cấu trúc trong một entry `key`, nhưng hai bên cần thống nhất một cách chính thức.
- `businessData.dataAvailability`: xác định phần đủ/thiếu và lý do (`FORBIDDEN`, `SOURCE_UNAVAILABLE`, `NOT_APPLICABLE`). Trường chưa biết trả `null`, danh sách rỗng chỉ có nghĩa không có bản ghi khi `complete: true`.
- `businessData.timeline`: `startDate`, `endDate`, `timezone`, `complete`. `interactions` chứa `id`, `at`, `side: customer|sale`, `type`, nội dung và người thực hiện. Bao gồm gọi điện, tin nhắn, ghi chú theo nguồn BE xác nhận; không suy luận chiều khách/sale từ tên người dùng.
- Số lượng luôn kèm đơn vị. Tiền là số, kèm `currency`; số tiền chính thức do BE tính. `remainingAmount` không được suy luận đơn giản nếu có hoàn tiền/điều chỉnh/ngoại tệ.
- `history`: lịch sử BE lưu thật, có ID, người thực hiện, thời điểm và nội dung. Đây là field đề xuất; FE cần sửa normalizer vì hiện đang tự dựng lịch sử khởi tạo.
- `tasks`: luôn là mảng. Công việc và cảnh báo có vòng đời riêng; task hoàn tất không mặc định đóng cảnh báo.

## 4. Sáu response mẫu

Các mẫu dùng cùng mốc đánh giá `2026-10-19T12:00:00+07:00`. Trường `businessData` ưu tiên tên FE đang đọc, đồng thời bổ sung các field chính thức để BE và FE chốt. Các ngưỡng trong sample minh họa flow ảnh, chưa phải phê duyệt thay đổi rule production.

### 4.1. Lead 3 ngày chưa ra cơ hội

Timeline drawer là 3 ngày lịch gần nhất; BE vẫn cần đối chiếu đầy đủ khoảng thời gian kích hoạt rule. `lastContactedAt: null` chỉ mang nghĩa chưa có liên hệ khi nguồn được xác nhận đầy đủ.

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
        "description": "Lead chưa chuyển cơ hội và không có tương tác trong ít nhất 3 ngày.",
        "parameters": {
          "days": 3,
          "operator": "GTE",
          "clockStart": "lead.createdAt",
          "requireNoOpportunity": true,
          "requireNoInteraction": true
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
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
          "opportunityId": null
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

### 4.2. Cơ hội 7 ngày chưa ra đơn

ID cơ hội là `DEAL`, không mặc nhiên là orderId. FE hiện đang thử tải view-on-edit bằng ID cơ hội; cần BE xác nhận cơ hội dùng chung bảng ID đơn hay có endpoint/quan hệ chuyển đổi riêng. Tương tác cuối trong mẫu nằm ngoài cửa sổ 7 ngày lịch của drawer; không chèn sự kiện đó vào ngày khác.

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2102,
      "type": "OPPORTUNITY_7_DAY",
      "title": "Cơ hội 7 ngày chưa ra đơn",
      "typeLabel": "Cơ hội",
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
        "kind": "DEAL",
        "id": 102,
        "code": "DEMO-DEAL-001",
        "name": "Cơ hội 7 ngày chưa ra đơn"
      },
      "rule": {
        "code": "OPPORTUNITY_7_DAY",
        "name": "Cơ hội 7 ngày chưa ra đơn",
        "description": "Cơ hội tồn tại ít nhất 7 ngày, chưa chuyển thành đơn và không có tương tác mới trong 7 ngày.",
        "parameters": {
          "days": 7,
          "operator": "GTE",
          "clockStart": "opportunity.createdAt",
          "requireNoOrder": true,
          "idleDays": 7
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
      },
      "suggestedAction": {
        "code": "CREATE_ORDER",
        "label": "Tạo đơn"
      },
      "businessData": {
        "triggerSummary": "Cơ hội 7 ngày chưa ra đơn, sale chưa phản hồi khách",
        "metricLabel": "7 ngày",
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
        "sourceName": "Facebook Page",
        "opportunity": {
          "id": 102,
          "statusName": "Đã báo giá",
          "createdAt": "2026-10-12T09:00:00+07:00",
          "convertedOrderId": null
        },
        "opportunityAt": "2026-10-12T09:00:00+07:00",
        "productNames": [
          "Vải minh họa"
        ],
        "expectedQuantity": 2000,
        "quantityUnit": "m",
        "interestLabel": "Trung bình",
        "appointmentAt": "2026-10-18T09:00:00+07:00",
        "lastContactedAt": "2026-10-12T10:00:00+07:00",
        "timeline": {
          "startDate": "2026-10-13T00:00:00+07:00",
          "endDate": "2026-10-19T12:00:00+07:00",
          "timezone": "Asia/Ho_Chi_Minh",
          "complete": true
        },
        "interactions": [],
        "lastInteraction": {
          "id": 4101,
          "at": "2026-10-12T10:00:00+07:00",
          "side": "customer",
          "type": "MESSAGE",
          "title": "Khách hỏi báo giá",
          "content": "Nội dung minh họa",
          "actorId": 501
        },
        "dataAvailability": {
          "timeline": {
            "complete": true
          }
        }
      },
      "history": [
        {
          "id": 3102,
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

### 4.3. Đơn chưa có lệnh sản xuất sau 3 ngày

Cần phân biệt “không có lệnh” với “chưa tải được lệnh”. Nếu đã lập lệnh một phần, BE trả số lượng còn thiếu theo `orderDetailId` và xác nhận có tiếp tục cảnh báo không. Không đổi ID đơn con khi lưu đơn.

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2103,
      "type": "ORDER_NOT_PLANNED",
      "title": "Đơn hàng chưa có lệnh sản xuất",
      "typeLabel": "Đơn hàng",
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
        "kind": "ORDER",
        "id": 34081,
        "code": "DEMO-ORDER-001",
        "name": "Đơn hàng chưa có lệnh sản xuất"
      },
      "rule": {
        "code": "ORDER_NOT_PLANNED",
        "name": "Đơn hàng chưa có lệnh sản xuất",
        "description": "Đơn đã xác nhận ít nhất 3 ngày, còn số lượng cần sản xuất chưa được lập lệnh.",
        "parameters": {
          "days": 3,
          "operator": "GTE",
          "clockStart": "order.confirmedAt",
          "scope": "UNPLANNED_QUANTITY"
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
      },
      "suggestedAction": {
        "code": "CREATE_MO",
        "label": "Tạo lệnh SX"
      },
      "businessData": {
        "triggerSummary": "Đơn đã xác nhận hơn 3 ngày chưa có lệnh sản xuất",
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
        "order": {
          "id": 34081,
          "code": "DEMO-ORDER-001",
          "statusName": "Đã xác nhận",
          "createdAt": "2026-10-16T09:00:00+07:00",
          "confirmedAt": "2026-10-16T09:00:00+07:00",
          "currency": "VND",
          "total": 1980000,
          "paid": 1000000,
          "priceOff": 270000,
          "shippingCost": 30000,
          "customerReceiverName": "Người nhận minh họa",
          "customerMobilePhone": "0900000000",
          "customerAddress": "Địa chỉ minh họa",
          "serviceName": "Sản xuất theo đơn",
          "details": [
            {
              "id": 34277,
              "orderDetailId": 34277,
              "productId": 601,
              "productName": "Vải minh họa",
              "code": "DEMO-SKU-01",
              "quantity": 300,
              "unit": "m",
              "providerId": 701,
              "providerName": "NCC minh họa"
            }
          ]
        },
        "providerName": "NCC minh họa",
        "productionCount": 0,
        "productionOrders": [],
        "planning": {
          "complete": true,
          "orderedQuantity": 300,
          "plannedQuantity": 0,
          "unplannedQuantity": 300,
          "unit": "m",
          "details": [
            {
              "orderDetailId": 34277,
              "orderedQuantity": 300,
              "plannedQuantity": 0,
              "unplannedQuantity": 300,
              "unit": "m"
            }
          ]
        },
        "shippingSummary": {
          "shipmentCount": 0,
          "deliveredQuantity": 0,
          "unit": "m"
        },
        "dataAvailability": {
          "order": {
            "complete": true
          },
          "production": {
            "complete": true
          }
        }
      },
      "history": [
        {
          "id": 3103,
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

### 4.4. Đơn hoàn thành/nhận đủ hàng nhưng chưa thu đủ

Không dùng INVOICE_OVERDUE để thay thế điều kiện này nếu không có quá hạn. `order.total`/`order.paid` trong sample tương đương totalPayable/netCollected để hỗ trợ UI hiện tại; FE cần ưu tiên số còn thu chính thức từ BE khi có điều chỉnh. Với USD phải giữ USD, không cộng/trừ tiền khác loại khi chưa quy đổi được BE xác nhận.

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2104,
      "type": "ORDER_COMPLETED_UNPAID",
      "title": "Đơn hoàn thành nhưng chưa thu đủ tiền",
      "typeLabel": "Đơn hàng",
      "severity": "CRITICAL",
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
        "kind": "ORDER",
        "id": 34081,
        "code": "DEMO-ORDER-001",
        "name": "Đơn hoàn thành nhưng chưa thu đủ tiền"
      },
      "rule": {
        "code": "ORDER_COMPLETED_UNPAID",
        "name": "Đơn hoàn thành nhưng chưa thu đủ tiền",
        "description": "Đơn đã hoàn thành hoặc khách đã nhận đủ hàng và còn phải thu lớn hơn 0.",
        "parameters": {
          "remainingAmountGreaterThan": 0,
          "completionCondition": "ORDER_COMPLETED_OR_FULLY_RECEIVED"
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
      },
      "suggestedAction": {
        "code": "COLLECT_DEBT",
        "label": "Thu tiền"
      },
      "businessData": {
        "triggerSummary": "Đơn đã hoàn thành, còn phải thu 980.000 đ",
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
        "order": {
          "id": 34081,
          "code": "DEMO-ORDER-001",
          "statusName": "Hoàn thành",
          "createdAt": "2026-10-16T09:00:00+07:00",
          "confirmedAt": "2026-10-16T09:00:00+07:00",
          "currency": "VND",
          "total": 1980000,
          "paid": 1000000,
          "priceOff": 270000,
          "shippingCost": 30000,
          "customerReceiverName": "Người nhận minh họa",
          "customerMobilePhone": "0900000000",
          "customerAddress": "Địa chỉ minh họa",
          "serviceName": "Sản xuất theo đơn",
          "details": [
            {
              "id": 34277,
              "orderDetailId": 34277,
              "productId": 601,
              "productName": "Vải minh họa",
              "code": "DEMO-SKU-01",
              "quantity": 300,
              "unit": "m",
              "providerId": 701,
              "providerName": "NCC minh họa"
            }
          ],
          "completedAt": "2026-10-17T16:00:00+07:00"
        },
        "providerName": "NCC minh họa",
        "remainingAmount": 980000,
        "payment": {
          "currency": "VND",
          "grossAmount": 2220000,
          "discountAmount": 270000,
          "shippingAmount": 30000,
          "totalPayable": 1980000,
          "netCollected": 1000000,
          "remainingAmount": 980000,
          "collectionRate": 0.5050505,
          "complete": true,
          "calculatedAt": "2026-10-19T12:00:00+07:00"
        },
        "fulfillment": {
          "fullyReceived": true,
          "receivedAt": "2026-10-17T16:00:00+07:00"
        },
        "dataAvailability": {
          "payment": {
            "complete": true
          },
          "fulfillment": {
            "complete": true
          }
        }
      },
      "history": [
        {
          "id": 3104,
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

### 4.5. Sản xuất còn 3 ngày đến hạn

Mỗi dòng phải có NCC, trạng thái và ID riêng. BE chốt cảnh báo theo một lệnh, một dòng hay tổng đơn; không trộn ID MO với ID ORDER. Hành động “Mở đơn” phải dùng `businessData.order.id`, “Liên hệ NCC” chọn NCC của dòng tương ứng.

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2105,
      "type": "PRODUCTION_DUE_SOON",
      "title": "Sản xuất còn 3 ngày đến hạn dự kiến",
      "typeLabel": "Sản xuất",
      "severity": "MEDIUM",
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
        "kind": "MO",
        "id": 801,
        "code": "DEMO-MO-001",
        "name": "Sản xuất còn 3 ngày đến hạn dự kiến"
      },
      "rule": {
        "code": "PRODUCTION_DUE_SOON",
        "name": "Sản xuất còn 3 ngày đến hạn dự kiến",
        "description": "Lệnh chưa hoàn thành, thời gian còn lại lớn hơn 0 và không quá 3 ngày.",
        "parameters": {
          "days": 3,
          "operator": "LTE",
          "excludeOverdue": true
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
      },
      "suggestedAction": {
        "code": "CONTACT_SUPPLIER",
        "label": "Liên hệ NCC"
      },
      "businessData": {
        "triggerSummary": "Còn 3 ngày đến hạn, sản xuất chưa hoàn thành",
        "metricLabel": "3 ngày",
        "daysRemainingLabel": "Còn 3 ngày",
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
        "order": {
          "id": 34081,
          "code": "DEMO-ORDER-001",
          "statusName": "Đã xác nhận",
          "createdAt": "2026-10-16T09:00:00+07:00",
          "confirmedAt": "2026-10-16T09:00:00+07:00",
          "currency": "VND",
          "total": 1980000,
          "paid": 1000000,
          "priceOff": 270000,
          "shippingCost": 30000,
          "customerReceiverName": "Người nhận minh họa",
          "customerMobilePhone": "0900000000",
          "customerAddress": "Địa chỉ minh họa",
          "serviceName": "Sản xuất theo đơn",
          "details": [
            {
              "id": 34277,
              "orderDetailId": 34277,
              "productId": 601,
              "productName": "Vải minh họa",
              "code": "DEMO-SKU-01",
              "quantity": 300,
              "unit": "m",
              "providerId": 701,
              "providerName": "NCC minh họa"
            }
          ]
        },
        "production": {
          "id": 801,
          "orderId": 34081,
          "code": "DEMO-MO-001",
          "dateEnd": "2026-10-22T12:00:00+07:00",
          "statusName": "Đang sản xuất",
          "remainingSeconds": 259200,
          "details": [
            {
              "id": 811,
              "productionOrderId": 801,
              "orderDetailId": 34277,
              "productName": "Vải minh họa",
              "quantity": 300,
              "completedQuantity": 180,
              "unit": "m",
              "providerId": 701,
              "providerName": "NCC minh họa",
              "providerPhone": "0900000001",
              "statusName": "Đang sản xuất",
              "expectedCompletedAt": "2026-10-22T12:00:00+07:00"
            }
          ]
        },
        "dataAvailability": {
          "production": {
            "complete": true
          },
          "supplierContact": {
            "complete": true
          }
        }
      },
      "history": [
        {
          "id": 3105,
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

### 4.6. Lệnh giao thiếu POD

Mẫu này theo điều kiện trong ảnh, KHÔNG thỏa rule cũ “đã giao hơn 48 giờ”. BE phải chốt một trong hai hoặc tách mã rule. POD cần liên kết shippingHistoryId đúng lần giao; giao lần 1 có POD không được làm đóng cảnh báo của lần 2.

```json
{
  "errorCode": 200,
  "success": true,
  "message": "success",
  "data": {
    "alert": {
      "id": 2106,
      "type": "DELIVERY_NO_POD",
      "title": "Lệnh giao chưa có Proof of Delivery",
      "typeLabel": "Kho vận",
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
        "kind": "SHIPPING",
        "id": 9011,
        "code": "DEMO-LG-001",
        "name": "Lệnh giao chưa có Proof of Delivery"
      },
      "rule": {
        "code": "DELIVERY_NO_POD",
        "name": "Lệnh giao chưa có Proof of Delivery",
        "description": "Đã quá ngày dự kiến giao nhưng lần giao chưa có POD hợp lệ.",
        "parameters": {
          "clockStart": "shipping.delivery.scheduledAt",
          "overdueSecondsGreaterThan": 0,
          "requiresValidPod": true,
          "ruleVariant": "EXPECTED_DELIVERY_PASSED"
        },
        "conditions": [],
        "autoClose": "BE kiểm tra lại điều kiện nghiệp vụ sau cập nhật"
      },
      "suggestedAction": {
        "code": "UPLOAD_POD",
        "label": "Cập nhật POD"
      },
      "businessData": {
        "triggerSummary": "Đã qua ngày dự kiến giao, chưa có POD trên hệ thống",
        "daysOverdueLabel": "Trễ 1 ngày",
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
        "order": {
          "id": 34081,
          "code": "DEMO-ORDER-001",
          "statusName": "Đã xác nhận",
          "createdAt": "2026-10-16T09:00:00+07:00",
          "confirmedAt": "2026-10-16T09:00:00+07:00",
          "currency": "VND",
          "total": 1980000,
          "paid": 1000000,
          "priceOff": 270000,
          "shippingCost": 30000,
          "customerReceiverName": "Người nhận minh họa",
          "customerMobilePhone": "0900000000",
          "customerAddress": "Địa chỉ minh họa",
          "serviceName": "Sản xuất theo đơn",
          "details": [
            {
              "id": 34277,
              "orderDetailId": 34277,
              "productId": 601,
              "productName": "Vải minh họa",
              "code": "DEMO-SKU-01",
              "quantity": 300,
              "unit": "m",
              "providerId": 701,
              "providerName": "NCC minh họa"
            }
          ]
        },
        "shipping": {
          "id": 9011,
          "shippingHistoryId": 9011,
          "deliveryCode": "DEMO-LG-001",
          "orderId": 34081,
          "orderCode": "DEMO-ORDER-001",
          "createdDate": "2026-10-17T09:00:00+07:00",
          "statusName": "Đã giao",
          "deliveredAt": "2026-10-18T16:00:00+07:00",
          "delivery": {
            "carrierId": 301,
            "carrierName": "Đơn vị vận chuyển minh họa",
            "trackingCode": "DEMO-TRACK-001",
            "scheduledAt": "2026-10-18T12:00:00+07:00"
          },
          "recipient": {
            "name": "Người nhận minh họa",
            "phone": "0900000000",
            "address": "Địa chỉ minh họa"
          },
          "details": [
            {
              "orderDetailId": 34277,
              "quantity": 100,
              "unit": "m"
            }
          ]
        },
        "pod": {
          "complete": true,
          "required": true,
          "status": "MISSING",
          "files": [],
          "url": null
        },
        "dataAvailability": {
          "shipping": {
            "complete": true
          },
          "pod": {
            "complete": true
          }
        }
      },
      "history": [
        {
          "id": 3106,
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

## 5. Timeline: ví dụ khi có tương tác và khi dữ liệu thiếu

Ví dụ một event để vẽ đúng hàng khách/sale và mở nội dung:

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

Khi nguồn tương tác lỗi/không có quyền, trả `interactions: []`, `timeline.complete: false`, cùng lý do trong `dataAvailability.timeline`. FE hiển thị “chưa có dữ liệu đầy đủ”, không hiển thị “không tương tác”. BE cần kiểm tra lại rule sau event mới; đây không phải một event chèn vào mẫu lead chưa tương tác ở mục 4.1.

## 6. Các API/thao tác cần BE xác nhận hoặc bổ sung

### 6.1. Giao việc — API đã được FE gọi

`POST /calendar/alert-task`:

```json
{
  "alertId": 2101,
  "expectedVersion": 1,
  "task": {
    "title": "Liên hệ lead",
    "ownerId": "901",
    "dueAt": "2026-10-20T09:00:00+07:00",
    "priority": "HIGH",
    "description": "Kiểm tra nhu cầu và ghi nhận kết quả"
  }
}
```

Cần kiểm soát người nhận việc trong đúng doanh nghiệp; phản hồi task đã lưu + alert/version mới. Task kết thúc không tự kết luận điều kiện nghiệp vụ đã hết.

### 6.2. Action cảnh báo — API đã được FE gọi

`POST /notification/action`, ví dụ bỏ qua:

```json
{
  "alertId": 2101,
  "expectedVersion": 1,
  "action": "IGNORE",
  "reason": "Trùng cảnh báo đã được phụ trách xử lý"
}
```

FE hiện dùng `REOPEN` + `snoozedUntil` cho nhắc lại. Đề nghị BE xác nhận có đúng hợp đồng không; ưu tiên action `SNOOZE` riêng nếu có thể thay đổi đồng bộ. Hiện client gửi `snoozedUntil` dạng `YYYY-MM-DD HH:mm:ss`; nếu chuyển ISO có offset cần sửa FE cùng lúc. `APPROVE` không được coi là “đã giải quyết mọi loại cảnh báo”; quyền và ý nghĩa tùy rule. Trả alert/version mới; BE ghi lịch sử trước/sau và người thao tác từ phiên xác thực.

### 6.3. Ghi nhận kết quả xử lý — đề xuất mới, chưa nối API

Tên endpoint gợi ý: `POST /erp/notification/alert/{id}/activities`.

```json
{
  "expectedVersion": 1,
  "requestId": "8edda941-143a-4ec9-8f21-011c88009eba",
  "activity": "CONTACT_CUSTOMER",
  "result": "FOLLOW_UP_REQUIRED",
  "notes": "Đã liên hệ, khách hẹn gọi lại",
  "attachments": [
    { "fileId": "file-demo-001", "filename": "minh-hoa.pdf" }
  ],
  "followUpAt": "2026-10-20T09:00:00+07:00"
}
```

- Lưu bền vững, có idempotency theo requestId; không tự đóng chỉ vì đã nhập ghi chú.
- `activity` và `result` cần enum chính thức; nhãn hiển thị tách khỏi mã lưu.
- `attachments` là file thật đã upload, không chỉ `{name, size}`. Kiểm tra quyền sở hữu file. Đoạn FE hiện tại mới giữ tên/kích thước trong phiên, chưa phải upload thật.
- Nếu `followUpAt` tạo công việc, BE trả task đã tạo; nếu chỉ là lịch nhắc, phải ghi rõ. Không tạo việc trùng khi retry.
- Response nên trả `activity`, `alert` với version mới và các task mới nếu có.

### 6.4. Đã đọc — đề xuất mới

Gợi ý `POST /erp/notification/alert/{id}/read`, đọc tất cả dùng endpoint bulk riêng với phạm vi/filter hoặc mốc thời gian rõ ràng. Trạng thái read lưu theo user, không đánh dấu đã đọc cho cả doanh nghiệp. Không cần FE gửi userId để tự quyết quyền.

### 6.5. POD theo lần giao — cần chốt API

Có thể tái sử dụng API upload nhiều file hiện có `POST /erp/folder/multiple` (multipart `files`, `folder`). Upload thành công chưa đồng nghĩa đã có POD: cần thao tác liên kết tài liệu vào bản ghi lần giao.

Gợi ý `POST /erp/shipping/{shippingHistoryId}/pod`:

```json
{
  "requestId": "81fea9b8-4d97-4c14-a44d-811822233344",
  "files": [
    { "filename": "shipping/pod-demo-001.jpg", "kind": "DELIVERY_PHOTO" }
  ],
  "receivedAt": "2026-10-18T16:00:00+07:00",
  "receiverName": "Người nhận minh họa",
  "notes": "Ảnh xác nhận giao hàng"
}
```

BE xác nhận tên field/tệp bằng ID hay filename theo hệ thống upload. Cần đọc lại danh sách POD và quyền tải file; nếu cần duyệt, phân biệt `UPLOADED`, `PENDING_REVIEW`, `VALID`, `REJECTED`. Chốt loại POD hợp lệ, ai được sửa/xóa, sau khi xóa có mở lại cảnh báo không. Không tự đặt thời điểm nhận hàng chỉ vì tải ảnh lên.

### 6.6. Tìm cảnh báo từ màn nghiệp vụ — đề xuất mới

Gợi ý `GET /erp/notification/alerts?entityKind=ORDER&entityId=34081&page=1&limit=20`.

- Lọc đúng doanh nghiệp/quyền user; có total/phân trang.
- Trả hết các cảnh báo liên quan đối tượng trong phạm vi yêu cầu, không phụ thuộc bucket summary.
- Nếu cần include cảnh báo lệnh SX/lần giao thuộc đơn, có tùy chọn quan hệ riêng; không nhập nhằng exact entityId.
- Với SHIPMENT/SHIPPING, MO/PRODUCTION, DEAL/ORDER: BE gửi danh mục enum và quan hệ ID. FE đang có alias không đồng nhất giữa một số chỗ, cần chuẩn hóa.

### 6.7. Kiểm tra lại và tự đóng

Sau tạo cơ hội/đơn, tạo lệnh, ghi nhận thu tiền, cập nhật tiến độ, thay hạn hoặc thêm POD hợp lệ: BE chạy lại rule bằng dữ liệu thật, lưu `evaluatedAt`, cập nhật alert/version/history. Có thể dùng sự kiện nội bộ hoặc job; chốt độ trễ để FE biết lúc refresh. Khi điều kiện trở lại, chốt mở lại bản ghi cũ hay sinh đợt cảnh báo mới, tránh phát sinh bản ghi trùng mỗi lần job chạy.

## 7. Những phần FE sẽ phải cập nhật sau khi chốt BE

1. Ánh xạ mã rule/entity và dữ liệu chi tiết chính thức; không fallback theo tiêu đề để xác định lâu dài.
2. Ưu tiên `businessData.payment.remainingAmount` chính thức, đọc đơn vị số lượng, trạng thái thiếu dữ liệu và lịch sử BE. Hiện FE vẫn có chỗ tự tính total-paid, mặc định VND và tự dựng lịch sử.
3. Lead/cơ hội mở đúng ID, không chỉ mở danh sách; cơ hội không gọi API đơn bằng ID DEAL nếu BE không bảo đảm cùng ID.
4. MO/POD mở đúng đơn liên quan. Bộ đọc hiện bổ sung order/view-on-edit theo loại entity, chưa tự tải chi tiết lead/MO/shipping; vì vậy BE nên gom businessData vào alert detail.
5. “Tạo lệnh SX”, “Liên hệ NCC”, “Cập nhật POD” hiện chủ yếu chuyển màn; cần nối tới bản ghi/hành động đúng. “Gọi khách” giữ quy tắc ẩn khi không có sipExt.
6. Thay ghi nhận trong phiên/đã đọc bằng API mới. Không coi checkbox ghi âm là đã có file ghi âm; cần dữ liệu thực từ tổng đài nếu làm tính năng này.
7. Sửa `completeTask`: hook hiện còn nhánh cục bộ đánh dấu cảnh báo resolved khi hoàn tất việc. Chuyển sang nhận trạng thái BE kiểm tra lại.
8. Cập nhật detail parser nếu response thay đổi, giữ tasks luôn là mảng, merge lịch sử/version/quyền nhất quán. Thống nhất format thời gian và prefix endpoint cùng BE.

## 8. Tiêu chí kiểm thử liên thông

- Mở từng drawer với dữ liệu đầy đủ, thiếu dữ liệu, thiếu quyền và API lỗi; không dùng placeholder giả làm dữ liệu thật.
- Timeline có khách/sale ở các ngày khác nhau; event đúng timezone, không nhân đôi; `complete: false` không kết luận không hoạt động.
- Một đơn có nhiều dòng, nhiều lệnh và nhiều lần giao: ID liên kết đúng, lập lệnh một phần không bị mất thông tin.
- VND/USD, đã thu bằng 0, điều chỉnh/hoàn tiền và số còn thu chính thức hiển thị đúng.
- Cập nhật một lần giao có POD không làm hết cảnh báo của lần giao khác.
- Lưu kết quả/đã đọc rồi reload vẫn còn; người khác không bị đánh dấu đã đọc thay.
- Version cũ trả 409, refresh rồi thao tác lại; retry có requestId không tạo ghi nhận/task trùng.
- Hoàn tất công việc nhưng điều kiện còn vi phạm: cảnh báo vẫn mở. Nghiệp vụ đã hết vi phạm: BE đóng đúng và ghi lịch sử.
- Truy vấn theo đối tượng trả đúng cảnh báo dù không có trong summary hiện tại.

## 9. Thông tin BE cần phản hồi để bắt đầu tích hợp

1. Response thực tế của summary và detail, ít nhất một mẫu cho mỗi loại cảnh báo.
2. Mã rule/entity chính thức; chốt từng điều kiện/ngưỡng và mốc tính ngày ở bảng mục 2.
3. `businessData` dùng các field nào, trường nullable/thiếu quyền, đơn vị và cách tính tiền.
4. Nguồn timeline nào đã tích hợp và có đảm bảo đầy đủ không.
5. Hợp đồng ghi nhận hoạt động, đã đọc, POD, truy vấn theo entity và danh mục quyền/action/result.
6. Cách BE trả version mới, conflict/idempotency, lịch sử và thời điểm kiểm tra lại/tự đóng.

Ưu tiên: (1) chi tiết 6 loại + rule/ID → (2) timeline và thanh toán chuẩn → (3) ghi nhận/đã đọc → (4) POD theo lần giao → (5) truy vấn theo đối tượng và đồng bộ trạng thái.
