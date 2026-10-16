import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'
import { notifyProductFormEdit } from './productFormEdit'

const ProductImagesUpload = () => (
  <FormFileUpload
    name="image"
    label="Hình ảnh sản phẩm"
    accept="image/*"
    folder="product"
    image
    maxSizeMB={8}
    onEdit={notifyProductFormEdit}
  />
)

export default ProductImagesUpload
