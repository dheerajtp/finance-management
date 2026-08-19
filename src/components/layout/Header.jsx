import { useSetAtom } from 'jotai'
import useActionAuth from '../../hooks/functionality/useActionAuth'
import { sidebarOpenAtom } from '../../store/ui.store'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import ConfirmModal from '../ui/ConfirmModal'
import NotificationBell from '../notifications/NotificationBell'
import ThemeToggle from './ThemeToggle'
import styles from './Header.module.css'

const Header = () => {
  const { currentUser, isLogoutConfirmOpen, requestLogout, cancelLogout, confirmLogout, loggingOut } = useActionAuth()
  const setSidebarOpen = useSetAtom(sidebarOpenAtom)

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          <Icon name="menu" />
        </button>
        <div className={styles.right}>
          <ThemeToggle />
          <NotificationBell />
          {currentUser && <span className={`text-secondary ${styles.userEmail}`}>{currentUser.email}</span>}
          <Button variant="secondary" onClick={requestLogout}>
            <Icon name="logout" />
            Log out
          </Button>
        </div>
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
