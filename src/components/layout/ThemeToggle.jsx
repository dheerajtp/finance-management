import { useAtom } from 'jotai'
import Icon from '../ui/Icon'
import { themePreferenceAtom } from '../../store/theme.store'
import styles from './ThemeToggle.module.css'

const OPTIONS = [
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'system', label: 'System', icon: 'monitor' },
]

// Compact header switcher — same themePreferenceAtom the Settings >
// Appearance section reads/writes (see AppearanceSettings.jsx), so picking
// a theme here and in Settings always agree. Plain client/UI state, read
// directly via Jotai here rather than through a functionality hook — same
// pattern Header.jsx already uses for sidebarOpenAtom.
const ThemeToggle = () => {
  const [preference, setPreference] = useAtom(themePreferenceAtom)

  return (
    <div className={styles.group} role="group" aria-label="Theme">
      {OPTIONS.map((option) => {
        const isActive = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            title={`${option.label} theme`}
            aria-label={`${option.label} theme`}
            aria-pressed={isActive}
            className={`${styles.option} ${isActive ? styles.active : ''}`}
            onClick={() => setPreference(option.value)}
          >
            <Icon name={option.icon} size="var(--icon-sm)" />
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle
