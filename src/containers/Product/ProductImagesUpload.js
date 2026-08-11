import FormFileUpload from '@/containers/PreviewModal/FormFileUpload'

const ProductImagesUpload = () => (
  <FormFileUpload
    name="image"
    label="Hình ảnh sản phẩm"
    accept="image/*"
    folder="product"
    image
    maxSizeMB={8}
  />
)

export default ProductImagesUpload
