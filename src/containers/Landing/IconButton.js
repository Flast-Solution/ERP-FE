import { Button } from 'antd'

/**
 * IconButton — wrapper mỏng quanh antd Button để giữ API cũ.
 *
 * variant: 'ghost' | 'solid' | 'brand'  →  antd type
 * size:    'sm' | 'md' | 'lg'           →  antd size
 * round:   boolean                      →  shape="circle"
 */
const VARIANT_MAP = {
  ghost: 'text',
  solid: 'default',
  brand: 'primary',
}

const SIZE_MAP = {
  sm: 'small',
  md: 'middle',
  lg: 'large',
}

export function IconButton({ variant = 'ghost', size = 'md', round = false, children, ...rest }) {
  return (
    <Button
      type={VARIANT_MAP[variant] ?? 'text'}
      size={SIZE_MAP[size] ?? 'middle'}
      shape={round ? 'circle' : 'default'}
      icon={children}
      {...rest}
    />
  )
}
