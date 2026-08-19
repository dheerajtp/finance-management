import { NavLink } from 'react-router-dom'
import { useAtom } from 'jotai'
import useActionAuth from '../../hooks/functionality/useActionAuth'
import { sidebarOpenAtom } from '../../store/ui.store'
import Icon from '../ui/Icon'
import Badge from '../ui/Badge'
import styles from './Sidebar.module.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Notifications', path: '/notifications', icon: 'bell' },
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Accounts', path: '/accounts', icon: 'wallet' },
      { label: 'Categories', path: '/categories', icon: 'tag' },
      { label: 'Transactions', path: '/transactions', icon: 'list' },
      { label: 'Subscriptions', path: '/subscriptions', icon: 'refresh' },
      { label: 'Recurring Transactions', path: '/recurring-transactions', icon: 'calendarCheck' },
    ],
  },
  { label: 'Insights', items: [{ label: 'Spending Analysis', path: '/spending-analysis', icon: 'barChart' }] },
  {
    label: 'Financial Planning',
    items: [
      { label: 'Safe to Spend', path: '/safe-to-spend', icon: 'scale' },
      { label: 'Emergency Fund', path: '/emergency-fund', icon: 'shield' },
      { label: 'Goals', path: '/goals', icon: 'flag' },
      { label: 'Budget', path: '/budgets', icon: 'target' },
      { label: 'Financial Freedom', path: '/financial-freedom', icon: 'compass' },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { label: 'Net Worth', path: '/net-worth', icon: 'activity' },
      { label: 'Investments', path: '/investments', icon: 'chartCandlestick' },
    ],
  },
]

const Sidebar = () => {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom)
  const { currentUser } = useActionAuth()

  const navLinkClass = ({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`
  const close = () => setIsOpen(false)

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={close} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <Icon name="compass" size="var(--icon-sm)" />
          </span>
          Financial Freedom OS
        </div>

        <nav className={styles.nav}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className={styles.group}>
              <p className={`text-label ${styles.groupLabel}`}>{group.label}</p>
              {group.items.map((item) =>
                item.path ? (
                  <NavLink key={item.label} to={item.path} className={navLinkClass} onClick={close}>
                    <Icon name={item.icon} className={styles.linkIcon} />
                    {item.label}
                  </NavLink>
                ) : (
                  <div key={item.label} className={styles.upcoming}>
                    <Icon name={item.icon} className={styles.linkIcon} />
                    <span className={styles.upcomingLabel}>{item.label}</span>
                    <Badge variant="neutral">Soon</Badge>
                  </div>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <NavLink to="/profile" className={navLinkClass} onClick={close}>
            <span className={styles.avatar}>
              <Icon name="user" />
            </span>
            <span className={styles.profileText}>
              <span className={styles.profileName}>Profile</span>
              {currentUser?.email && <span className={styles.profileEmail}>{currentUser.email}</span>}
            </span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass} onClick={close}>
            <Icon name="settings" className={styles.linkIcon} />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
