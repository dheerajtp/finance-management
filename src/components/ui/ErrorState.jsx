import Button from './Button'
import Icon from './Icon'
import styles from './ErrorState.module.css'

const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className={styles.wrap} role="alert">
      <Icon name="alertTriangle" className={styles.icon} />
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <Icon name="refresh" size="var(--icon-sm)" />
          Try again
        </Button>
      )}
    </div>
  )
}

export default ErrorState
