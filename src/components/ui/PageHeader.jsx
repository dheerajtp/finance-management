import styles from './PageHeader.module.css'

// One consistent title/description/action row for every page — compact,
// not a hero heading. `actions` accepts any node(s): a single Button, a
// Select + Button pair, etc.
const PageHeader = ({ title, description, actions, className = '' }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.text}>
        <h1 className="text-page-title">{title}</h1>
        {description && <p className="text-page-subtitle">{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}

export default PageHeader
