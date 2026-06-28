/* ============================================================
   Design tokens — thay thế hoàn toàn các file .css
   Import file này thay vì các file colors/spacing/... .css
   ============================================================ */

export const color = {
  /* Violet */
  violet50:  '#f3f0ff',
  violet100: '#e9e3ff',
  violet200: '#d6caff',
  violet300: '#b9a4ff',
  violet400: '#9a78ff',
  violet500: '#7c5cff',
  violet600: '#6b46f0',
  violet700: '#5a36d6',
  violet800: '#4a2cab',
  violet900: '#3d2786',
  violet950: '#241552',

  /* Neutral */
  neutral0:    '#ffffff',
  neutral25:   '#fbfbfc',
  neutral50:   '#f6f6f8',
  neutral100:  '#ededf1',
  neutral200:  '#dcdce4',
  neutral300:  '#bcbcc9',
  neutral400:  '#9494a6',
  neutral500:  '#6f6f82',
  neutral600:  '#545465',
  neutral700:  '#3b3b49',
  neutral800:  '#27272f',
  neutral850:  '#1d1d24',
  neutral900:  '#161619',
  neutral950:  '#0e0e10',
  neutral1000: '#08080a',

  /* Semantic */
  green400: '#34d399',
  green500: '#10b981',
  green600: '#059669',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  red400:   '#f87171',
  red500:   '#ef4444',
  red600:   '#dc2626',
  blue400:  '#60a5fa',
  blue500:  '#3b82f6',
}

/* ── Dark theme (mặc định cho overlay chrome) ── */
export const darkTheme = {
  /* Brand */
  brand:        color.violet500,
  brandHover:   color.violet400,
  brandActive:  color.violet600,
  brandSubtle:  'rgba(124, 92, 255, 0.16)',
  brandRing:    'rgba(124, 92, 255, 0.45)',
  onBrand:      '#ffffff',

  /* Surfaces */
  surfaceBase:    color.neutral950,
  surfaceRaised:  color.neutral900,
  surfaceOverlay: 'rgba(20, 20, 24, 0.82)',
  surfaceCard:    color.neutral850,
  surfaceInset:   color.neutral1000,
  surfaceHover:   'rgba(255, 255, 255, 0.04)',
  surfaceActive:  'rgba(255, 255, 255, 0.07)',

  /* Borders */
  borderSubtle:  'rgba(255, 255, 255, 0.07)',
  borderDefault: 'rgba(255, 255, 255, 0.11)',
  borderStrong:  'rgba(255, 255, 255, 0.18)',

  /* Text */
  textPrimary:   '#f4f4f6',
  textSecondary: '#b4b4c0',
  textTertiary:  '#7d7d8c',
  textDisabled:  '#565663',
  textOnAccent:  '#ffffff',

  /* Highlight */
  highlightBorder: color.violet500,
  highlightFill:   'rgba(124, 92, 255, 0.09)',
  highlightLabel:  color.violet500,
  highlightGlow:   'rgba(124, 92, 255, 0.35)',

  /* Feedback */
  success:        color.green500,
  successSubtle:  'rgba(16, 185, 129, 0.16)',
  warning:        color.amber500,
  warningSubtle:  'rgba(245, 158, 11, 0.18)',
  danger:         color.red500,
  dangerSubtle:   'rgba(239, 68, 68, 0.16)',
  info:           color.blue500,
  infoSubtle:     'rgba(59, 130, 246, 0.16)',

  /* Violet shortcuts */
  violet300: color.violet300,
  violet400: color.violet400,
  violet500: color.violet500,
  violet700: color.violet700,
  green400:  color.green400,
  red400:    color.red400,
  neutral800: color.neutral800,
}

/* ── Light theme (dùng cho .patch-light — host app) ── */
export const lightTheme = {
  ...darkTheme,
  surfaceBase:    color.neutral0,
  surfaceRaised:  color.neutral25,
  surfaceOverlay: 'rgba(255, 255, 255, 0.9)',
  surfaceCard:    color.neutral0,
  surfaceInset:   color.neutral50,
  surfaceHover:   'rgba(16, 16, 24, 0.04)',
  surfaceActive:  'rgba(16, 16, 24, 0.07)',

  borderSubtle:  'rgba(16, 16, 24, 0.07)',
  borderDefault: 'rgba(16, 16, 24, 0.12)',
  borderStrong:  'rgba(16, 16, 24, 0.2)',

  textPrimary:   '#161619',
  textSecondary: '#54545f',
  textTertiary:  '#8a8a96',
  textDisabled:  '#b4b4c0',

  brandSubtle: 'rgba(124, 92, 255, 0.10)',
}

export const spacing = {
  s0:  '0',
  s1:  '2px',
  s2:  '4px',
  s3:  '6px',
  s4:  '8px',
  s5:  '10px',
  s6:  '12px',
  s8:  '16px',
  s10: '20px',
  s12: '24px',
  s16: '32px',
  s20: '40px',
  s24: '48px',
  s32: '64px',
  s40: '80px',
  s48: '96px',

  controlSm: '28px',
  controlMd: '34px',
  controlLg: '40px',

  overlayGutter: '16px',
  maxPromptW:    '720px',
}

export const radius = {
  xs:   '4px',
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  xl2:  '22px',
  pill: '999px',
}

export const shadow = {
  sm: '0 1px 2px rgba(0,0,0,0.4)',
  md: '0 4px 12px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)',
  lg: '0 12px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.4)',
  xl: '0 24px 60px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.45)',

  edgeHighlight: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  ringFocus:     '0 0 0 3px rgba(124, 92, 255, 0.45)',
  glowAgent:     '0 0 0 1px rgba(124, 92, 255, 0.35), 0 6px 20px rgba(124, 92, 255, 0.35)',

  blurPanel: '16px',
  blurScrim: '4px',
}

export const motion = {
  easeOut:   'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.45, 0, 0.2, 1)',
  easeSnap:  'cubic-bezier(0.16, 1, 0.3, 1)',

  instant: '80ms',
  fast:    '140ms',
  base:    '200ms',
  slow:    '320ms',
}

export const typography = {
  fontSans: '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontMono: '"Geist Mono", ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',

  text2xs:  '0.6875rem',
  textXs:   '0.75rem',
  textSm:   '0.8125rem',
  textBase: '0.875rem',
  textMd:   '0.9375rem',
  textLg:   '1.0625rem',
  textXl:   '1.375rem',
  text2xl:  '1.75rem',
  text3xl:  '2.25rem',
  text4xl:  '3rem',

  weightRegular:  400,
  weightMedium:   500,
  weightSemibold: 600,
  weightBold:     700,

  leadingTight:   1.15,
  leadingSnug:    1.3,
  leadingNormal:  1.5,
  leadingRelaxed: 1.65,

  trackingTight:  '-0.02em',
  trackingSnug:   '-0.01em',
  trackingNormal: '0',
  trackingWide:   '0.02em',
  trackingCaps:   '0.06em',
}

/* Shorthand object để dùng trực tiếp trong styled-components */
export const t = {
  ...darkTheme,
  ...spacing,
  ...radius,
  ...shadow,
  ...motion,
  ...typography,
}
