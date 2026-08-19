import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

const NotFoundPage = () => {
  return (
    <div className={styles.wrap}>
      <p className={styles.code}>404</p>
      <p className="text-secondary">Page not found.</p>
      <Link to="/" className={styles.link}>
        Back home
      </Link>
    </div>
  )
}

export default NotFoundPage
