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

## 2. Mở modal — 3 bước bắt buộc

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
- [ ] `InAppEvent` import từ `@flast-erp/core/utils/FuseUtils`
- [ ] `HASH_POPUP` import từ `@/configs/constant`
- [ ] Modal container nhận `onSave` và gọi đúng sau khi API thành công
- [ ] Route modal đã được đăng ký và thêm vào `routes/ModalRoutes/index.js`
- [ ] `FormListAddition` dùng đúng typo `FormListAddtion` (không phải `Addition`)
