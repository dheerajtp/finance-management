import styles from './PageLoader.module.css'

const PageLoader = () => {
  return (
    <div className={styles.wrap} role="status" aria-label="Loading">
      <span className={styles.spinner} />
    </div>
  )
}

export default PageLoader
