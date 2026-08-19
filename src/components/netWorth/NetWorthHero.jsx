import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import { calculateNetWorthChange } from '../../utils/finance/netWorth'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './NetWorthHero.module.css'

const getStatus = (netWorth) => {
  if (netWorth > 0) return { label: 'Positive', variant: 'success' }
  if (netWorth < 0) return { label: 'Below zero', variant: 'warning' }
  return { label: 'Balanced', variant: 'neutral' }
}

// The net worth number is the visual focal point — a negative position is
// flagged with a calm amber badge, never a red hero number, and described
// factually rather than with alarmist language.
const NetWorthHero = ({ group, showCurrencyLabel }) => {
  const { currency, totalAssets, totalLiabilities, netPosition } = group
  const status = getStatus(netPosition)
  // No historical net worth snapshot exists yet for this MVP (see
  // utils/finance/netWorth.js) — `previous` is always null here, which is
  // exactly what makes this show "No historical comparison yet" instead of
  // a fabricated trend.
  const change = calculateNetWorthChange(netPosition, null)

  return (
    <Card variant="hero" className={styles.card}>
      {showCurrencyLabel && <p className={`text-label ${styles.currencyLabel}`}>{currency}</p>}

      <div className={styles.header}>
        <div className={styles.title}>
          <Icon name="landmark" size="var(--icon-sm)" className={styles.titleIcon} />
          <h2 className="text-label">Net Worth</h2>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <p className={`text-hero-metric ${styles.value}`}>{formatCurrency(netPosition, currency)}</p>
      <p className="text-caption">
        {netPosition < 0 ? 'Liabilities currently exceed recorded assets.' : 'Your current financial position.'}{' '}
        {change === null && 'No historical comparison yet.'}
      </p>

      <div className={styles.split}>
        <div>
          <p className="text-label">Assets</p>
          <p className="text-card-title">{formatCurrency(totalAssets, currency)}</p>
        </div>
        <div>
          <p className="text-label">Liabilities</p>
          <p className="text-card-title">{formatCurrency(totalLiabilities, currency)}</p>
        </div>
        <div>
          <p className="text-label">Net Worth</p>
          <p className="text-card-title">{formatCurrency(netPosition, currency)}</p>
        </div>
      </div>
    </Card>
  )
}

export default NetWorthHero
