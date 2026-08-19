import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import styles from './UnclassifiedAccountsNotice.module.css'

// 'Other'-type accounts are excluded from every asset/liability total, but
// they must never just silently disappear — this surfaces that they exist
// and why they're not counted.
const UnclassifiedAccountsNotice = ({ count }) => {
  const navigate = useNavigate()

  if (count === 0) return null

  return (
    <div className={styles.notice}>
      <Icon name="alertTriangle" size="var(--icon-sm)" className={styles.icon} />
      <p className={`text-secondary ${styles.text}`}>
        {count} account{count === 1 ? '' : 's'} {count === 1 ? "isn't" : "aren't"} included in net worth because{' '}
        {count === 1 ? 'its' : 'their'} financial classification is not defined.
      </p>
      <Button variant="secondary" onClick={() => navigate('/accounts')}>
        Review accounts
      </Button>
    </div>
  )
}

export default UnclassifiedAccountsNotice
