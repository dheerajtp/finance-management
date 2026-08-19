import { Link } from 'react-router-dom'
import IconBox from '../ui/IconBox'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import styles from './FinancialHealthItem.module.css'

const STATUS_LABEL = {
  not_configured: 'Not configured',
  insufficient_data: 'Not enough data',
  in_progress: 'In progress',
  on_track: 'On track',
  target_reached: 'Target reached',
  needs_attention: 'Needs attention',
  pending: 'Pending',
  skipped: 'Skipped',
  paused: 'Paused',
}

// Restrained on purpose — "needs attention"/"pending" are muted warnings,
// never danger red: this is an observation layer, not a verdict.
const STATUS_VARIANT = {
  not_configured: 'neutral',
  insufficient_data: 'neutral',
  skipped: 'neutral',
  paused: 'neutral',
  in_progress: 'info',
  on_track: 'success',
  target_reached: 'success',
  needs_attention: 'warning',
  pending: 'warning',
}

const PROGRESS_STATE = { needs_attention: 'warning', pending: 'warning', on_track: 'success', target_reached: 'success' }

// Purely presentational — every field it renders is already computed by
// utils/finance/financialHealth.js. No status derivation happens here.
const FinancialHealthItem = ({ icon, route, area }) => (
  <div className={styles.row}>
    <IconBox icon={icon} accent="muted" size="sm" />
    <div className={styles.body}>
      <div className={styles.headline}>
        <span className="text-card-title">{area.title}</span>
        <Badge variant={STATUS_VARIANT[area.status] ?? 'neutral'}>{STATUS_LABEL[area.status] ?? area.status}</Badge>
      </div>
      <p className="text-caption">{area.message}</p>
      {typeof area.progress === 'number' && (
        <Progress percentage={area.progress} label={`${area.title} progress`} state={PROGRESS_STATE[area.status] ?? 'default'} />
      )}
    </div>
    {route && (
      <Link to={route} className={styles.review}>
        Review
      </Link>
    )}
  </div>
)

export default FinancialHealthItem
