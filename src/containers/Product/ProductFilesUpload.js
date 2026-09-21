import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'

const ProductFilesUpload = () => (
  <FormFileUpload
    name="file"
    label="Tài liệu sản phẩm"
    folder="product/files"
    maxSizeMB={20}
  />
)

export default ProductFilesUpload
