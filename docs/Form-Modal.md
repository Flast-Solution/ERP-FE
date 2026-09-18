# Flast ERP — Form & Modal Skill

Áp dụng skill này bất cứ khi nào:
- Tạo hoặc chỉnh sửa form trong dự án Flast ERP
- Mở drawer / popup từ bất kỳ component nào
- Code bên trong một overlay container

---

## 1. Form wrappers — LUÔN dùng `@flast-erp`, KHÔNG dùng antd trực tiếp

```js
import { XXXX } from '@flast-erp/core/components'
```

`XXXX` bao gồm:
- `FormInput`
- `FormSelect`
- `FormSelectAPI`
- `FormInputNumber`
- `FormHidden`
- `FormCheckBox`
- `FormRadio`
- `FormRadioGroup`
- `FormListAddition`
- `FormDatePicker`
- `FormTextArea`
- `FormAutoComplete`

**Ngoại lệ được phép dùng antd trực tiếp:**
- `Form`, `Form.Item`, `Form.useForm()` — dùng antd
- `ColorPicker` — dùng antd, kèm `getValueFromEvent={(color) => color.toHexString()}`
- Layout: `Col`, `Row` — dùng antd

**Submit button:** dùng `CustomButton` từ core:
```js
import { CustomButton } from '@flast-erp/core/components'
// ...
<CustomButton htmlType="submit" />
```

**Layout form list:**
```js
import { FormListStyles } from '@/css/global'
// dùng thay cho Row trong FormListAddition
<FormListStyles gutter={16}>
  <Col md={6} xs={24}>...</Col>
</FormListStyles>
```

---

## 2. FormSelectAPI — Select dữ liệu từ API endpoint

`FormSelectAPI` tự fetch data từ API, có search debounce 600ms, add-new-item inline, tự wrap `Form.Item`.

### Props quan trọng

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `name` | string/array | — | Tên field trong Form |
| `label` | string | `''` | Label hiển thị (tự dịch qua i18n) |
| `apiPath` | string | `''` | Endpoint GET, **không có** dấu `/` đầu. VD: `'erp/products'` |
| `valueProp` | string | `'id'` | Field dùng làm value của option |
| `titleProp` | string | `'name'` | Field dùng làm label của option |
| `searchKey` | string | `'name'` | Query param khi user search |
| `required` | bool | — | Bắt buộc chọn |
| `placeholder` | string | — | Placeholder (tự dịch i18n) |
| `isFetchOnMount` | bool | `true` | Fetch ngay khi mount |
| `filter` | object | — | Query params mặc định gửi kèm khi fetch |
| `onData` | `(data) => data` | — | Transform data trước khi render options |
| `fnLoadData` | `(filter) => Promise` | — | Custom fetch thay thế `apiPath` |
| `formatText` | `(value, item) => string` | — | Custom label text của option |
| `formatValue` | `(value, item) => any` | — | Custom value của option |
| `onChangeGetSelectedItem` | `(value, item) => void` | — | Callback trả về cả object item khi chọn |
| `apiAddNewItem` | string | `''` | Endpoint POST để thêm item mới inline |
| `createDefaultValues` | object | — | Default values kèm theo khi POST add-new |
| `isShowModalCreateNewItem` | bool | — | Ẩn input add-new, dùng modal riêng thay thế |
| `onCreateNewItem` | `() => bool` | — | Custom handler add-new, return `true` để chặn default behavior |

### Ví dụ cơ bản — fetch từ API

```js
<FormSelectAPI
  name="product_id"
  label="Sản phẩm"
  apiPath="erp/products"
  required
  placeholder="Chọn sản phẩm"
  valueProp="id"
  titleProp="name"
  searchKey="name"
/>
```

### Ví dụ nâng cao — transform data + callback lấy item

```js
<FormSelectAPI
  name="user_id"
  label="Nhân viên"
  apiPath="erp/users"
  valueProp="id"
  titleProp="full_name"
  filter={{ role: 'staff', status: 1 }}
  onData={(data) => data.filter((u) => u.active)}
  formatText={(val, item) => `${item.full_name} (${item.code})`}
  onChangeGetSelectedItem={(value, item) => setSelectedUser(item)}
/>
```

### Ví dụ add-new inline trong dropdown

```js
<FormSelectAPI
  name="category_id"
  label="Danh mục"
  apiPath="erp/categories"
  apiAddNewItem="erp/categories/create"
  searchKey="name"
  createDefaultValues={{ type: 'product' }}
/>
```

### Ví dụ dùng fnLoadData thay apiPath (local data hoặc custom fetch)

```js
<FormSelectAPI
  name="step_type"
  label="Loại bước"
  fnLoadData={() => Promise.resolve(stepTypes)}
  valueProp="key"
  titleProp="label"
  isFetchOnMount
/>
```

---

## 3. Mở overlay — chọn đúng kênh TRƯỚC khi code

Hệ thống có **hai** kênh overlay độc lập, sống ở tầng root trong `App.js`:

| Loại | Component | Vỏ render | Emit | Đóng | Đăng ký tại | Import hash từ |
|------|-----------|-----------|------|------|-------------|----------------|
| **Drawer** | `ModalRoutes` | `DrawerCustom` | `HASH_MODAL` | `HASH_MODAL_CLOSE` | `routes/ModalRoutes/` | `@/configs` |
| **Popup** | `MyPopup` | antd `Modal` | `HASH_POPUP` | `HASH_POPUP_CLOSE` | `routes/PopupRoute/` | `@/configs/constant` |

> ⚠️ Hai mảng route hoàn toàn tách biệt. Đăng ký ở `routes/ModalRoutes/` mà emit `HASH_POPUP` (hoặc ngược lại) sẽ **không match** và render ra component rỗng — không throw, không warning, chỉ là overlay trắng.

**Khác biệt cần biết khi chọn:**
- Drawer hỗ trợ **route lồng** qua `modalRoute.routes` — gom nhiều màn con dưới một `path` cha. Popup chỉ match phẳng một cấp.
- Drawer normalize hash: `/` được đổi thành `.` trước khi match.
- Popup có cờ `reLoad` toggle mỗi lần đóng, inject xuống component để màn gọi tự refresh. Drawer không có.
- Popup width mặc định `800` nếu `modalOptions.width` không khai báo.

---

### 3A. Drawer — `HASH_MODAL`

**Bước 1: Đăng ký**

```js
// routes/ModalRoutes/TenFeatureModalRoute.js
import React from 'react'

const TenFeatureModalRoute = [
  {
    path: 'feature.action.name',       /* hash định danh duy nhất, dot notation */
    Component: React.lazy(() =>
      import('@/containers/TenFeature/ModalTenContainer')
    ),
    modalOptions: {
      title: '',     /* để trống, title truyền động qua InAppEvent */
      width: 750,
    },
  },
]

export default TenFeatureModalRoute
```

Thêm vào `routes/ModalRoutes/index.js`:
```js
import TenFeatureModalRoute from './TenFeatureModalRoute'
/* spread vào mảng tổng */
...TenFeatureModalRoute,
```

**Bước 2: Emit**

```js
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_MODAL } from '@/configs'

const handleOpenDrawer = () => {
  InAppEvent.emit(HASH_MODAL, {
    hash: 'feature.action.name',        /* khớp path đã đăng ký */
    title: 'Tiêu đề hiển thị',
    data: {
      someData: currentData,
      onSave: (result) => handleResult(result),
    },
  })
}
```

Đóng chủ động từ nơi khác: `InAppEvent.emit(HASH_MODAL_CLOSE)`.

---

### 3B. Popup — `HASH_POPUP`

**Bước 1: Đăng ký**

```js
// routes/PopupRoute/TenFeature.js
import React from 'react'

const TenFeature = [
  {
    path: 'feature.popup.name',
    Component: React.lazy(() =>
      import('@/containers/TenFeature/PopupTenContainer')
    ),
    modalOptions: { title: '', width: 600 },
  },
]

export default TenFeature
```

Thêm vào mảng `modalRoutes` trong `routes/PopupRoute/index.js`.

**Bước 2: Emit**

```js
import { InAppEvent } from '@flast-erp/core/utils'
import { HASH_POPUP } from '@/configs/constant'

InAppEvent.emit(HASH_POPUP, {
  hash: 'feature.popup.name',
  title: 'Tiêu đề hiển thị',
  data: { someData: currentData },
})
```

> Lưu ý: popup spread `params.data` trực tiếp thành props (`{...(params.data || {})}`), drawer spread cả `params` (`{...params}`) nên component drawer nhận thêm `hash`, `title`, `open`.

---

### Bước 3: Code bên trong container (chung cho cả hai)

```js
import { Col, Form, message } from 'antd'
import { useEffect } from 'react'
import {
  FormInput,
  FormSelect,
  FormListAddition,
  CustomButton,
} from '@flast-erp/core/components'
import { FormListStyles } from '@/css/global'
import { RequestUtils } from '@flast-erp/core/utils'
import { SUCCESS_CODE } from '@/configs'

/* Props inject tự động từ overlay system — khai báo trong data của InAppEvent */
const ModalTenContainer = ({ someData, onSave, closeModal }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({ lists: someData })
  }, [form, someData])

  const onSubmit = async (values) => {
    const { data, errorCode, message: EMS } =
      await RequestUtils.Post('/api/endpoint', values)
    if (errorCode === SUCCESS_CODE) {
      onSave(data)   /* bắn kết quả về màn hình gọi */
      closeModal()
    }
    message.info(EMS)
  }

  return (
    <Form form={form} onFinish={onSubmit}>
      <FormListAddition name="lists" textAddNew="Thêm mới">
        <RowItem />
      </FormListAddition>
      <div style={{ marginTop: -50 }}>
        <CustomButton htmlType="submit" />
      </div>
    </Form>
  )
}

/* Sub-component render 1 row trong FormListAddition */
const RowItem = ({ field }) => {
  const { name } = field || { name: 0 }
  return (
    <FormListStyles gutter={16}>
      <Col md={12} xs={24}>
        <FormInput required placeholder="Tên" name={[name, 'name']} />
      </Col>
      <Col md={12} xs={24}>
        <FormSelect
          required
          placeholder="Trạng thái"
          resourceData={[
            { id: 1, name: 'Kích hoạt' },
            { id: 0, name: 'Ngưng' },
          ]}
          name={[name, 'status']}
        />
      </Col>
    </FormListStyles>
  )
}

export default ModalTenContainer
```
