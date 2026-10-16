import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'
import { notifyProductFormEdit } from './productFormEdit'

const ProductFilesUpload = () => (
  <FormFileUpload
    name="file"
    label="Tài liệu sản phẩm"
    folder="product/files"
    maxSizeMB={20}
    onEdit={notifyProductFormEdit}
  />
)

export default ProductFilesUpload
