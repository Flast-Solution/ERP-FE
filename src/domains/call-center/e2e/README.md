# E2E webrtc_gw (SBC)

Hai file test gốc đã chạy được với SBC, giữ lại làm tài liệu luồng cho `softphone/`:

- `caller.py` — trunk giả (UDP 5081) gọi DID vào SBC: `python3 caller.py <did> <talk|cancel|wait> <giây>`
- `webrtc_gw.e2e.js` — Playwright: trình duyệt làm máy nhánh (token, register, gọi vào, gọi ra, PIN bằng DTMF, gia hạn binding).

Chạy trên máy có SBC: `cd e2e && node webrtc_gw.e2e.js` (không thuộc bộ test Jest của FE).

## Ánh xạ sang FE (`softphone/gatewayApi.js`)

| http_api (Bearer token webrtc)                    | Hàm FE                    | Dùng ở                        |
|---------------------------------------------------|---------------------------|-------------------------------|
| `POST omni/webrtc/register?ext=` (API app)        | `gatewayApi.token`        | `Softphone.connect`           |
| `POST /api/webrtc/sessions` -> `{id, sdp, ext}`   | `gatewayApi.createSession`| `Softphone.connect`           |
| `GET /api/webrtc/sessions/{id}`                   | `gatewayApi.status`       | poll 500ms                    |
| `POST .../{id}/dial?to=&caller=`                  | `gatewayApi.dial`         | nút Gọi                       |
| `POST .../{id}/dtmf?digits=`                      | `gatewayApi.dtmf`         | bàn phím trong cuộc gọi       |
| `POST .../{id}/answer`                            | `gatewayApi.answer`       | nút Nghe                      |
| `POST .../{id}/reject`                            | `gatewayApi.reject`       | nút Từ chối                   |
| `POST .../{id}/hangup`                            | `gatewayApi.hangup`       | nút Kết thúc                  |
| `POST .../{id}/unregister`                        | `gatewayApi.unregister`   | Tạm nghỉ / rời trang          |
