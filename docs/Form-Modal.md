# Flast ERP — Form & Modal Skill

Áp dụng skill này bất cứ khi nào:
- Tạo hoặc chỉnh sửa form trong dự án Flast ERP
- Mở modal / popup từ bất kỳ component nào
- Code bên trong một modal container

---

## 1. Form wrappers — LUÔN dùng `@/form-flast`, KHÔNG dùng antd trực tiếp

```js
import FormInput        from '@/form-flast/FormInput'
import FormSelect       from '@/form-flast/FormSelect'
import FormSelectAPI    from '@/form-flast/FormSelectAPI'   // Select từ API endpoint
import FormInputNumber  from '@/form-flast/FormInputNumber'
import FormHidden       from '@/form-flast/FormHidden'
import FormListAddition from '@/form-flast/FormListAddtion'   // chú ý typo "Addtion"
import FormDatePicker   from '@/form-flast/FormDatePicker'
import FormTextArea     from '@/form-flast/FormTextArea'
import FormRadioGroup   from '@/form-flast/FormRadioGroup'
import FormAutoComplete from '@/form-flast/FormAutoComplete'
```

**Ngoại lệ được phép dùng antd trực tiếp:**
- `Form`, `Form.Item`, `Form.useForm()` — dùng antd
- `ColorPicker` — dùng antd, kèm `getValueFromEvent={(color) => color.toHexString()}`
- Layout: `Col`, `Row` — dùng antd

**Submit button:** dùng `CustomButton` từ core:
```js
import CustomButton from '@flast-erp/core/components/CustomButton'
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

## 3. Mở modal — 3 bước bắt buộc

### Bước 1: Đăng ký modal (trong `routes/ModalRoutes/`)

```js
// routes/ModalRoutes/TenFeatureModalRoute.js
import React from 'react'

const TenFeatureModalRoute = [
  {
    path: 'feature.action.name',       // hash định danh duy nhất, dạng dot notation
    Component: React.lazy(() =>
      import('@/containers/TenFeature/ModalTenContainer')
    ),
    modalOptions: {
      title: '',     // để trống, title truyền động qua InAppEvent
      width: 750,    // điều chỉnh theo nội dung
    },
  },
]

export default TenFeatureModalRoute
```

Sau đó thêm vào `routes/ModalRoutes/index.js`:
```js
import TenFeatureModalRoute from './TenFeatureModalRoute'
// spread vào array tổng
...TenFeatureModalRoute,
```

### Bước 2: Emit event để mở modal

```js
import { InAppEvent } from '@flast-erp/core/utils/FuseUtils'
import { HASH_POPUP } from '@/configs/constant'

const handleOpenModal = () => {
  InAppEvent.emit(HASH_POPUP, {
    hash: 'feature.action.name',        // khớp với path đã đăng ký
    title: 'Tiêu đề hiển thị trên modal',
    data: {
      // props inject vào component modal
      someData: currentData,
      onSave: (result) => handleResult(result),
    },
  })
}
```

### Bước 3: Code bên trong modal container

```js
import { Col, Form, message } from 'antd'
import { useEffect } from 'react'
import FormInput        from '@/form-flast/FormInput'
import FormSelect       from '@/form-flast/FormSelect'
import FormListAddition from '@/form-flast/FormListAddtion'
import { FormListStyles } from '@/css/global'
import CustomButton from '@flast-erp/core/components/CustomButton'
import RequestUtils from '@flast-erp/core/utils/RequestUtils'
import { SUCCESS_CODE } from '@/configs'

// Props được inject tự động từ modal system (khai báo trong data của InAppEvent)
const ModalTenContainer = ({ someData, onSave }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    form.setFieldsValue({ lists: someData })
  }, [form, someData])

  const onSubmit = async (values) => {
    const { data, errorCode, message: EMS } =
      await RequestUtils.Post('/api/endpoint', values)
    if (errorCode === SUCCESS_CODE) {
      onSave(data)   // bắn kết quả về màn hình gọi
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

// Sub-component render 1 row trong FormListAddition
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

---

## 3. Checklist trước khi submit code

- [ ] Tất cả field input dùng `@/form-flast/*`, không dùng antd Input/Select trực tiếp
- [ ] Select từ API dùng `FormSelectAPI` với `apiPath` không có dấu `/` đầu
- [ ] `FormSelectAPI` dùng `fnLoadData` khi data đã có sẵn local (không cần fetch)
- [ ] `InAppEvent` import từ `@flast-erp/core/utils/FuseUtils`
- [ ] `HASH_POPUP` import từ `@/configs/constant`
- [ ] Modal container nhận `onSave` và gọi đúng sau khi API thành công
- [ ] Route modal đã được đăng ký và thêm vào `routes/ModalRoutes/index.js`
- [ ] `FormListAddition` dùng đúng typo `FormListAddtion` (không phải `Addition`)
