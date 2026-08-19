import styles from './Section.module.css'

// The card-free alternative to Card for dashboard-style grouping: a
// heading, an optional right-aligned action, and content — separated from
// its neighbors by spacing and an optional hairline, never a full border
// or shadow box. Reach for Card only when a section genuinely needs a
// raised, bounded surface (a hero number, a modal, a table); everything
// else that's just "a titled group of content" belongs here instead.
const Section = ({ title, description, actions, divider = true, className = '', bodyClassName = '', children }) => (
  <section className={`${styles.section} ${className}`}>
    {(title || actions) && (
      <div className={`${styles.head} ${divider ? styles.headDivider : ''}`}>
        <div>
          {title && <h2 className="text-section-title">{title}</h2>}
          {description && <p className={`text-caption ${styles.description}`}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    )}
    <div className={bodyClassName || styles.body}>{children}</div>
  </section>
)

export default Section
