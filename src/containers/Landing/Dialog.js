import { useEffect } from 'react'
import { Scrim, Panel, Head, IconWrap, Titles, Title, Subtitle, CloseBtn, Body, Foot } from './Dialog.style'

const CloseGlyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export function Dialog({
  open = false,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  children,
  ...rest
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <Scrim onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) onClose?.() }}>
      <Panel $size={size} role="dialog" aria-modal="true" {...rest}>
        {(title || icon) && (
          <Head>
            {icon && <IconWrap>{icon}</IconWrap>}
            <Titles>
              {title && <Title>{title}</Title>}
              {subtitle && <Subtitle>{subtitle}</Subtitle>}
            </Titles>
            {onClose && (
              <CloseBtn type="button" aria-label="Đóng" onClick={onClose}>
                <CloseGlyph />
              </CloseBtn>
            )}
          </Head>
        )}
        <Body>{children}</Body>
        {footer && <Foot>{footer}</Foot>}
      </Panel>
    </Scrim>
  )
}
