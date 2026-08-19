import styles from './Sparkline.module.css'

const Sparkline = ({ data, width = 160, height = 64, color = 'var(--color-success)', fillOpacity = 0.14 }) => {
  if (!data || data.length < 2) {
    return (
      <div className={styles.placeholder} style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation">
          <path
            d={`M0 ${height / 2} C ${width * 0.25} ${height * 0.4}, ${width * 0.5} ${height * 0.6}, ${width} ${height * 0.5}`}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.9"
          />
        </svg>
      </div>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * (height - 12) - 6
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return (
    <div className={styles.wrap} style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="presentation">
        <path d={areaPath} fill={color} opacity={fillOpacity} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default Sparkline
