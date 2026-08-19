import { forwardRef } from 'react'
import styles from './Input.module.css'

const Input = forwardRef(
  ({ label, error, helperText, required, id, prefix, suffix, className = '', ...props }, ref) => {
    const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined

    return (
      <div className={`${styles.field} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={`${styles.inputWrap} ${error ? styles.error : ''}`}>
          {prefix && <span className={`${styles.affix} ${styles.prefix}`}>{prefix}</span>}
          <input
            id={id}
            ref={ref}
            required={required}
            className={styles.input}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          {suffix && <span className={`${styles.affix} ${styles.suffix}`}>{suffix}</span>}
        </div>
        {error && (
          <span id={`${id}-error`} role="alert" className={styles.errorText}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${id}-helper`} className={styles.helper}>
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
