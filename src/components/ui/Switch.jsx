import styles from './Switch.module.css'

// A real toggle switch: native <button role="switch">, so keyboard
// activation (Enter/Space), the disabled attribute, and focus-visible
// styling all come for free from the browser rather than being
// reimplemented. State is never conveyed by color alone — the thumb's
// left/right position is the primary signal, aria-checked carries it to
// assistive tech, and `label` is required so every switch has an
// accessible name (visible text elsewhere in the row is not enough on its
// own for a screen reader landing directly on the control).
const Switch = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className={`${styles.switch} ${checked ? styles.checked : ''}`}
    onClick={() => onChange(!checked)}
  >
    <span className={styles.thumb} />
  </button>
)

export default Switch
