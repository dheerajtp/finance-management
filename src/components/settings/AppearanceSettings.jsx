import Icon from '../ui/Icon'
import { THEME_OPTIONS } from '../../store/theme.store'
import styles from './AppearanceSettings.module.css'

const ICON_BY_VALUE = { dark: 'moon', light: 'sun', system: 'monitor' }

// Persists immediately (no Save button) — selecting a card applies and
// stores the theme right away, via useThemeSync reacting to the same atom
// this reads/writes (theme.store.js). Native radio inputs so the current
// selection, keyboard navigation (arrow keys between cards, same as any
// radio group), and screen-reader semantics all come from the browser
// rather than being reimplemented.
const AppearanceSettings = ({ theme, onChange }) => (
  <div className={styles.group}>
    {THEME_OPTIONS.map((option) => {
      const isActive = theme === option.value
      return (
        <label key={option.value} className={`${styles.card} ${isActive ? styles.active : ''}`}>
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={isActive}
            onChange={() => onChange(option.value)}
            className={styles.input}
          />
          <Icon name={ICON_BY_VALUE[option.value]} size="var(--icon-md)" />
          <span className="text-body">{option.label}</span>
        </label>
      )
    })}
  </div>
)

export default AppearanceSettings
