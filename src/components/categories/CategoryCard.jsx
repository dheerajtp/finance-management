import { useState, useRef, useEffect } from 'react'
import Icon from '../ui/Icon'
import { getCategoryIcon } from '../../constants/categoryIcons'
import styles from './CategoryCard.module.css'

const CategoryCard = ({ category, onEdit, onToggleActive }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const typeLabel =
    category.type === 'expense' ? (category.is_essential ? 'Essential' : 'Discretionary') : 'Income'

  const iconClass =
    category.type === 'income'
      ? styles.iconIncome
      : category.is_essential
        ? styles.iconEssential
        : styles.iconDiscretionary

  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [menuOpen])

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={`${styles.iconWrap} ${iconClass}`}>
          <Icon name={getCategoryIcon(category)} size="var(--icon-sm)" />
        </span>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Category actions"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1, fontWeight: 600 }}>
              ⋮
            </span>
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onEdit(category)
                }}
              >
                <Icon name="pencil" size="var(--icon-xs)" />
                Edit
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${category.is_active ? styles.menuItemDanger : ''}`}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onToggleActive(category)
                }}
              >
                <Icon name={category.is_active ? 'archive' : 'archiveRestore'} size="var(--icon-xs)" />
                {category.is_active ? 'Archive' : 'Restore'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.name} title={category.name}>
          {category.name}
        </p>
        <span className={styles.type}>{typeLabel}</span>
        <div className={styles.meta}>
          <span className={`${styles.dot} ${category.is_active ? styles.dotActive : styles.dotInactive}`} aria-hidden="true" />
          <span className={`${styles.status} ${category.is_active ? styles.statusActive : styles.statusInactive}`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
          {category.is_system && <span className={styles.defaultBadge}>Default</span>}
        </div>
      </div>
    </div>
  )
}

export default CategoryCard
