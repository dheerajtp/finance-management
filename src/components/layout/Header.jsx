import { useLocation } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import useActionAuth from '../../hooks/functionality/useActionAuth'
import { sidebarOpenAtom } from '../../store/ui.store'
import { protectedRoutes } from '../../routes/routes'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import ConfirmModal from '../ui/ConfirmModal'
import NotificationBell from '../notifications/NotificationBell'
import ThemeToggle from './ThemeToggle'
import styles from './Header.module.css'

const Header = () => {
  const { currentUser, isLogoutConfirmOpen, requestLogout, cancelLogout, confirmLogout, loggingOut } = useActionAuth()
  const setSidebarOpen = useSetAtom(sidebarOpenAtom)
  const { pathname } = useLocation()

  const pageTitle = protectedRoutes.find((route) => route.path === pathname)?.meta?.title ?? 'Overview'

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <Icon name="menu" />
        </button>
        <span className="text-section-title">{pageTitle}</span>
      </div>
      <div className={styles.right}>
        <ThemeToggle />
        <NotificationBell />
        {currentUser && <span className={`text-secondary ${styles.userEmail}`}>{currentUser.email}</span>}
        <Button variant="secondary" onClick={requestLogout}>
          <Icon name="logout" />
          Log out
        </Button>
      </div>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        variant="danger"
        loading={loggingOut}
      />
    </header>
  )
}

export default Header
