import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { INVESTMENT_TYPE_MAP } from '../../constants/investmentTypes'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './InvestmentHoldingCard.module.css'

// Gain/loss is always labeled with the word "Gain" or "Loss", never color
// alone — restrained styling, not a trading-terminal ticker.
const InvestmentHoldingCard = ({ holding, onEdit, onManageSip, onToggleActive }) => {
  const typeLabel = INVESTMENT_TYPE_MAP[holding.type]?.label ?? holding.type
  const isGain = holding.gain >= 0

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{holding.name}</p>
          <p className="text-caption">
            {typeLabel} · {holding.accountName}
          </p>
        </div>
        {!holding.is_active && <Badge variant="neutral">Inactive</Badge>}
      </div>

      <div className={styles.headline}>
        <p className="text-metric">{formatCurrency(holding.current_value, holding.currency)}</p>
        <p className="text-secondary">of {formatCurrency(holding.invested_amount, holding.currency)} invested</p>
      </div>

      <div className={styles.gainRow}>
        <span className={`text-delta ${isGain ? 'text-delta--up' : 'text-delta--down'}`}>
          {isGain ? 'Gain' : 'Loss'}: {formatCurrency(Math.abs(holding.gain), holding.currency)}
        </span>
        {holding.gainPercentage !== null && (
          <span className={`text-delta ${isGain ? 'text-delta--up' : 'text-delta--down'}`}>
            {isGain ? '+' : ''}
            {holding.gainPercentage.toFixed(1)}%
          </span>
        )}
      </div>

      {holding.monthlySip > 0 && (
        <p className="text-caption">Monthly SIP: {formatCurrency(holding.monthlySip, holding.currency)}</p>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(holding)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onManageSip(holding)}>
          Manage SIP
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(holding)}>
          {holding.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default InvestmentHoldingCard
