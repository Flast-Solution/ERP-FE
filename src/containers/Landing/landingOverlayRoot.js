/**
 * Root để portal overlay (popup, mobile menu).
 * - Trong editor: gắn vào khung preview (data-landing-frame) để overlay nằm trong
 *   khung mobile/desktop, không tràn ra toàn bộ IDE.
 * - Runtime / trang publish: document.body → fullscreen theo viewport thật.
 */
export const getLandingOverlayRoot = () => {
  if (typeof document === 'undefined') return null
  return document.querySelector('[data-landing-frame="true"]') || document.body
}
