/* Shared SVG icons dùng chung trong toàn bộ editor */

const ic = (extra = {}) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...extra,
})

export const Bolt = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z" />
  </svg>
)

export const Undo = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
  </svg>
)

export const Redo = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h1" />
  </svg>
)

export const Monitor = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const Phone = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </svg>
)

export const Cursor = () => (
  <svg {...ic({ width: 17, height: 17 })}>
    <path d="m4 4 7 17 2.5-7L20 11z" />
  </svg>
)

export const Gear = ({ size = 18 }) => (
  <svg {...ic({ width: size, height: size })}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.62.77 1.05 1.42 1.05H21a2 2 0 0 1 0 4h-.09c-.65 0-1.22.43-1.42 1.05z" />
  </svg>
)

export const Trash = () => (
  <svg {...ic({ width: 15, height: 15 })}>
    <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const Plus = () => (
  <svg {...ic({ width: 14, height: 14 })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Link = () => (
  <svg {...ic({ width: 13, height: 13 })}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
)

export const Plug = () => (
  <svg {...ic({ width: 15, height: 15 })}>
    <path d="M12 22v-5M9 8V2M15 8V2M18 8H6a2 2 0 0 0-2 2v2a6 6 0 0 0 12 0v-2a2 2 0 0 0-2-2z" />
  </svg>
)

export const Search = () => (
  <svg {...ic({ width: 15, height: 15 })}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
