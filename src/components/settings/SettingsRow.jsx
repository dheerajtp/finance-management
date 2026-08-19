import Icon from '../ui/Icon'
import styles from './SettingsRow.module.css'

// One consistent icon/title/description/value/action row, used throughout
// Settings so every section reads the same way instead of each building
// its own layout. `value` is the current read-only state of a setting
// (e.g. a currency code); `action` is an interactive control (a Switch, a
// Button, a link) — either, both, or neither may be present.
const SettingsRow = ({ icon, title, description, value, action }) => (
  <div className={styles.row}>
    {icon && (
      <span className={styles.iconWrap}>
        <Icon name={icon} size="var(--icon-sm)" />
      </span>
    )}
    <div className={styles.text}>
      <p className="text-body">{title}</p>
      {description && <p className="text-caption">{description}</p>}
    </div>
    {value !== undefined && value !== null && <div className={styles.value}>{value}</div>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
)

export default SettingsRow
