import Card from '../ui/Card'
import Icon from '../ui/Icon'
import styles from './SettingsSection.module.css'

// One consistent titled-card shell for every Settings section — keeps
// sections compact and visually consistent without each one re-building its
// own header.
const SettingsSection = ({ icon, title, description, badge, children }) => (
  <Card className={styles.card}>
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <Icon name={icon} size="var(--icon-sm)" className={styles.icon} />
        <p className="text-section-title">{title}</p>
        {badge}
      </div>
      {description && <p className="text-caption">{description}</p>}
    </div>
    <div className={styles.body}>{children}</div>
  </Card>
)

export default SettingsSection
