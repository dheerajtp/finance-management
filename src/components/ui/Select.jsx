import { forwardRef } from 'react'
import Icon from './Icon'
import styles from './Select.module.css'

const Select = forwardRef(
  ({ label, error, required, id, placeholder, options, className = '', ...props }, ref) => {
    return (
      <div className={`${styles.field} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={`${styles.selectWrap} ${error ? styles.error : ''}`}>
          <select
            id={id}
            ref={ref}
            required={required}
            className={styles.select}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Icon name="chevronDown" className={styles.chevron} />
        </div>
        {error && (
          <span id={`${id}-error`} role="alert" className={styles.errorText}>
            {error}
          </span>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'

export default Select
