import Icon from './Icon'
import styles from './IconBox.module.css'

const ACCENT_BG = {
  success: 'var(--color-success-muted)',
  warning: 'var(--color-warning-muted)',
  danger: 'var(--color-danger-muted)',
  info: 'var(--color-info-muted)',
  purple: 'var(--color-purple-muted)',
  muted: 'var(--color-surface-interactive)',
}

const ACCENT_FG = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
  purple: 'var(--color-purple)',
  muted: 'var(--color-text-secondary)',
}

const SIZES = {
  sm: { box: '2rem', icon: 'var(--icon-sm)' },
  md: { box: '2.25rem', icon: 'var(--icon-md)' },
  lg: { box: '2.5rem', icon: 'var(--icon-lg)' },
}

// The one reusable "icon in a subtle tinted square" pattern used across
// metric cards, feature nav cards, and account/category type markers —
// intentionally the only place that combines an Icon with a colored container.
const IconBox = ({ icon, accent = 'muted', size = 'md', className = '' }) => {
  const dims = SIZES[size] ?? SIZES.md

  return (
    <span
      className={`${styles.box} ${className}`}
      style={{ width: dims.box, height: dims.box, background: ACCENT_BG[accent], color: ACCENT_FG[accent] }}
      aria-hidden="true"
    >
      <Icon name={icon} size={dims.icon} />
    </span>
  )
}

export default IconBox
