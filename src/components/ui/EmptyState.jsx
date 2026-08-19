import Icon from './Icon'
import styles from './EmptyState.module.css'

const EmptyState = ({ icon = 'inbox', title, description, action, className = '' }) => {
  return (
    <div className={`${styles.wrap} ${className}`}>
      {icon && (
        <span className={styles.icon}>
          {typeof icon === 'string' ? <Icon name={icon} size="var(--icon-xl)" /> : icon}
        </span>
      )}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}

export default EmptyState
