import { atomWithStorage } from 'jotai/utils'

// The stored preference: 'system' follows the OS setting; 'light'/'dark' are
// explicit overrides. Not "the currently rendered theme" — see useThemeSync,
// which resolves 'system' against the OS at apply time.
export const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// The app is designed Neo-Dark first — default to dark rather than 'system'
// so a light-OS visitor isn't dropped into an unrequested light mode.
export const DEFAULT_THEME = 'dark'

export const themePreferenceAtom = atomWithStorage('ffos:theme', DEFAULT_THEME)
