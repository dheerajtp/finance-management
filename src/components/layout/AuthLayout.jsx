import { Outlet } from 'react-router-dom'
import Icon from '../ui/Icon'
import styles from './AuthLayout.module.css'

const AuthLayout = () => {
  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Icon name="compass" size="var(--icon-sm)" />
          </span>
          FINANCIAL FREEDOM OS
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
