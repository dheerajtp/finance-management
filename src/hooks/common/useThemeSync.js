import { useEffect } from 'react'
import { useAtomValue } from 'jotai'
import { themePreferenceAtom } from '../../store/theme.store'

const getSystemTheme = () => (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

// Applies the stored theme preference to the document root so it's live
// everywhere in the app, not just while the Settings page is open. Mounted
// once at the app shell (see App.jsx).
const useThemeSync = () => {
  const preference = useAtomValue(themePreferenceAtom)

  useEffect(() => {
    const applyResolvedTheme = () => {
      document.documentElement.dataset.theme = preference === 'system' ? getSystemTheme() : preference
    }

    applyResolvedTheme()

    if (preference !== 'system') return undefined

    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', applyResolvedTheme)
    return () => media.removeEventListener('change', applyResolvedTheme)
  }, [preference])
}

export default useThemeSync
