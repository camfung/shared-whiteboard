// Chrome (top bar + board manager) theme palettes. The tldraw canvas has its own
// dark mode (driven via editor.user colorScheme); these values only style the
// app-owned UI around it so the whole thing reads as one light/dark surface.
export type Theme = 'light' | 'dark'

type Palette = {
  appBg: string        // page / manager background
  barBg: string        // top chrome bar
  barBorder: string
  text: string
  muted: string
  btnBg: string
  btnBorder: string
  sep: string          // vertical divider in the bar
  cardBg: string       // manager card
  thumbBg: string      // manager thumbnail well
  thumbBorder: string
}

export const PALETTE: Record<Theme, Palette> = {
  light: {
    appBg: '#f7f8f1', barBg: '#eef0e6', barBorder: '#d8dbcf', text: '#3a3f2f',
    muted: '#6b7059', btnBg: '#f7f8f1', btnBorder: '#b7bca8', sep: '#c7cbb8',
    cardBg: '#f7f8f1', thumbBg: '#fdfdf8', thumbBorder: '#d8dbcf',
  },
  dark: {
    appBg: '#1b1e16', barBg: '#23271d', barBorder: '#3a3f2f', text: '#d6dac9',
    muted: '#8b9074', btnBg: '#2b2f24', btnBorder: '#4a4f3d', sep: '#3f4433',
    cardBg: '#23271d', thumbBg: '#14160f', thumbBorder: '#3a3f2f',
  },
}

const KEY = 'wb-theme'

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* localStorage blocked — fall back to system pref */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function persistTheme(theme: Theme) {
  try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
}
