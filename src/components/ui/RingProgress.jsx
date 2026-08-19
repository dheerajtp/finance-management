import styles from './RingProgress.module.css'

// Single-value circular progress — pure SVG, no chart library.
const RingProgress = ({
  percentage,
  size = 96,
  strokeWidth = 10,
  color = 'var(--color-accent)',
  label,
  sublabel,
}) => {
  const clamped = Math.min(100, Math.max(0, percentage))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-surface-interactive)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={styles.arc}
        />
      </svg>
      {(label || sublabel) && (
        <div className={styles.center}>
          {label && <span className={styles.centerLabel}>{label}</span>}
          {sublabel && <span className={styles.centerSublabel}>{sublabel}</span>}
        </div>
      )}
    </div>
  )
}

export default RingProgress
