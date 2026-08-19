import { Link, useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Icon from '../ui/Icon'
import RingProgress from '../ui/RingProgress'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SavingsTarget.module.css'

const SavingsTarget = ({ savingsTarget, currency }) => {
  const navigate = useNavigate()
  const { hasTarget, actual, target, difference, progress } = savingsTarget

  return (
    <Card variant="hero" className={styles.card}>
      <p className="text-section-title">Savings Target</p>

      {hasTarget ? (
        <>
          <div className={styles.body}>
            <RingProgress
              percentage={progress}
              color={difference >= 0 ? 'var(--color-success)' : 'var(--color-accent)'}
              label={`${Math.round(progress)}%`}
            />
            <div className={styles.figures}>
              <p className={`text-hero-metric ${styles.value}`}>{formatCurrency(actual, currency)}</p>
              <p className="text-caption">saved of {formatCurrency(target, currency)} target</p>
              <span className={`text-delta ${difference >= 0 ? 'text-delta--up' : 'text-delta--down'}`}>
                {difference >= 0
                  ? `${formatCurrency(difference, currency)} above target`
                  : `${formatCurrency(Math.abs(difference), currency)} remaining`}
              </span>
            </div>
          </div>
          <Link to="/profile" className={styles.viewProfile}>
            View profile
            <Icon name="chevronRight" size="var(--icon-xs)" />
          </Link>
        </>
      ) : (
        <>
          <p className={`text-hero-metric ${styles.value}`}>{formatCurrency(actual, currency)}</p>
          <EmptyState
            icon="piggyBank"
            title="No target set"
            description="Set a monthly savings target in your profile to track progress here."
            action={
              <Button variant="secondary" onClick={() => navigate('/profile')}>
                Update profile
              </Button>
            }
            className={styles.empty}
          />
        </>
      )}
    </Card>
  )
}

export default SavingsTarget
