import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import MainContent from './MainContent'
import useNotificationSync from '../../hooks/functionality/useNotificationSync'
import styles from './AppLayout.module.css'

const AppLayout = () => {
  // Mounted once per authenticated session (every protected route renders
  // inside this layout) — the right place for a once-per-session sync, not
  // any individual page.
  useNotificationSync()

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Header />
        <MainContent>
          <Outlet />
        </MainContent>
      </div>
    </div>
  )
}

export default AppLayout
