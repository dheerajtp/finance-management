import { useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import NotificationPanel from './NotificationPanel'
import { useUnreadNotificationCountQuery } from '../../hooks/api/useNotificationApi'
import styles from './NotificationBell.module.css'

const badgeLabel = (count) => (count > 9 ? '9+' : String(count))

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef(null)
  const unreadCountQuery = useUnreadNotificationCountQuery()
  const unreadCount = unreadCountQuery.data ?? 0

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setIsOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={isOpen}
      >
        <Icon name="bell" size="var(--icon-md)" />
        {unreadCount > 0 && <span className={styles.badge}>{badgeLabel(unreadCount)}</span>}
      </button>

      {isOpen && <NotificationPanel onClose={() => setIsOpen(false)} />}
    </div>
  )
}

export default NotificationBell
