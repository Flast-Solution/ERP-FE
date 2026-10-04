## Luồng chạy APP ##
- Đọc các file .js ở trong thư mục .guide để nắm rõ cách dự án làm việc.
- Đọc thêm các giải thích và qui tắc bên dưới.

1. Layout chung File src/App.js

<Auth>
  Sua khi auth thì MainLayout chạy src/layouts/PrivateLayout.js
  <Authorization>
    Trong PrivateLayout có Header, Sidebar, routes của cả dự án
    <MainLayout />
  </Authorization>
</Auth>

Trong Suspense là hai loại drawer(ModalRoutes) và modal (MyPopup) được mở bằng InAppEvent.emit(...)
<Suspense fallback={<Loading />}>
  <ModalRoutes />
  <MyPopup />
</Suspense>

2. Page riêng

Cấu trúc của một màn hình chức năng như sau.
- Các route sẽ gọi các file trong src/pages.
- Các page sẽ gọi các file trong src/containers.

3. Quy ước code

if/else/for/while luôn có {}, kể cả khi thân chỉ có một dòng.
Comment dùng /* */, không dùng //.
Hàm hoặc lời gọi quá 5 cột thì xuống dòng, mỗi tham số một dòng, ) đóng ở dòng riêng.
