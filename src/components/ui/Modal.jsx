import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import styles from './Modal.module.css'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

const Modal = ({ isOpen, onClose, title, icon, children, footer, size = 'md' }) => {
  const dialogRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    previouslyFocused.current = document.activeElement
    document.body.classList.add('body--scroll-locked')

    const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR)
    ;(focusable?.[0] ?? dialogRef.current)?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const elements = Array.from(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])
      if (elements.length === 0) return

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('body--scroll-locked')
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalRoot = document.getElementById('modal-root')
  if (!modalRoot) return null

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {title && (
          <div className={styles.header}>
            <h2 id="modal-title" className={styles.title}>
              {icon && <Icon name={icon} size="var(--icon-md)" className={styles.titleIcon} />}
              {title}
            </h2>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close dialog">
              <Icon name="close" />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    modalRoot,
  )
}

export default Modal
