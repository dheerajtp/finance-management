import Card from './Card'
import IconBox from './IconBox'
import Skeleton from './Skeleton'
import styles from './StatCard.module.css'

const DELTA_ARROW = { up: '↑', down: '↓', flat: '' }

const StatCard = ({ label, value, delta, deltaDirection = 'flat', icon, accent, description, loading }) => {
  if (loading) {
    return (
      <Card className={styles.card}>
        <Skeleton width="60%" height="0.8125rem" />
        <Skeleton width="45%" height="1.75rem" />
        <Skeleton width="35%" height="0.8125rem" />
      </Card>
    )
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <p className="text-label">{label}</p>
        {icon && <IconBox icon={icon} accent={accent} size="md" />}
      </div>
      <p className={`text-metric ${styles.value}`}>{value}</p>
      {(delta || description) && (
        <div className={styles.footer}>
          {delta && (
            <span className={`text-delta text-delta--${deltaDirection}`}>
              {DELTA_ARROW[deltaDirection]} {delta}
            </span>
          )}
          {description && <p className={`text-caption ${styles.description}`}>{description}</p>}
        </div>
      )}
    </Card>
  )
}

export default StatCard
