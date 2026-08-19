import styles from './DonutChart.module.css'

const DonutChart = ({ segments, size = 120, strokeWidth = 16, centerLabel, centerSublabel }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="presentation">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-interactive)"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => {
          const portion = seg.value / total
          const length = circumference * portion
          const dash = `${length} ${circumference - length}`
          const currentOffset = offset
          offset += length
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className={styles.segment}
            />
          )
        })}
      </svg>
      {(centerLabel || centerSublabel) && (
        <div className={styles.center}>
          {centerLabel && <span className={styles.centerLabel}>{centerLabel}</span>}
          {centerSublabel && <span className={styles.centerSublabel}>{centerSublabel}</span>}
        </div>
      )}
    </div>
  )
}

export default DonutChart
