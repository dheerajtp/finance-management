import styles from './Progress.module.css'

const Progress = ({ percentage, label, value, state = 'default' }) => {
  const clamped = Math.min(100, Math.max(0, percentage))
  const stateClass = state !== 'default' ? styles[state] : ''

  return (
    <div className={`${styles.wrap} ${stateClass}`}>
      {(label || value !== undefined) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {value !== undefined && <span className={styles.value}>{value}</span>}
        </div>
      )}
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || undefined}
      >
        <div className={styles.fill} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

export default Progress
