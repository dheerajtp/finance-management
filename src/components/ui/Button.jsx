import styles from './Button.module.css'

const Button = ({ children, loading, disabled, variant = 'primary', className = '', ...props }) => {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${styles.button} ${styles[variant]} ${className}`}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
