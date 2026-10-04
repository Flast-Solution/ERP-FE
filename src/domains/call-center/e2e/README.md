# E2E webrtc_gw (SBC)

Hai file test gốc đã chạy được với SBC, giữ lại làm tài liệu luồng cho `softphone/`:

- `caller.py` — trunk giả (UDP 5081) gọi DID vào SBC: `python3 caller.py <did> <talk|cancel|wait> <giây>`
- `webrtc_gw.e2e.js` — Playwright: trình duyệt làm máy nhánh (token, register, gọi vào, gọi ra, PIN bằng DTMF, gia hạn binding).

Chạy trên máy có SBC: `cd e2e && node webrtc_gw.e2e.js` (không thuộc bộ test Jest của FE).

## Ánh xạ sang FE

| Lệnh DI (UDP 5040)              | Endpoint backend ERP cần proxy       | Dùng ở                     |
|---------------------------------|--------------------------------------|----------------------------|
| POST :8090/api/webrtc/token     | `POST call-center/webrtc/token`      | `Softphone.connect`        |
| `webrtc_gw create <ip> <port>`  | `POST call-center/webrtc/create`     | `Softphone.connect`        |
| `webrtc_gw register id ext tok` | `POST call-center/webrtc/register`   | `Softphone.connect`        |
| `webrtc_gw status id`           | `POST call-center/webrtc/status`     | poll 500ms                 |
| `webrtc_gw answer id`           | `POST call-center/webrtc/answer`     | nút Nghe                   |
| `webrtc_gw dial id number`      | `POST call-center/webrtc/dial`       | nút Gọi                    |
| `webrtc_gw dtmf id digits`      | `POST call-center/webrtc/dtmf`       | bàn phím trong cuộc gọi    |
| `webrtc_gw hangup id`           | `POST call-center/webrtc/hangup`     | Từ chối / Kết thúc         |
| `webrtc_gw unregister id`       | `POST call-center/webrtc/unregister` | Tạm nghỉ / rời trang       |

Backend trả `{ result: "<chuỗi DI nguyên bản>" }` (token trả `{ token, expires }`).
Bearer của API token là bí mật phía server, không đưa xuống trình duyệt.
