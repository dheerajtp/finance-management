import { useNavigate } from 'react-router-dom'
import IconBox from '../ui/IconBox'
import Icon from '../ui/Icon'
import Progress from '../ui/Progress'
import Skeleton from '../ui/Skeleton'
import { summarizeGoals } from '../../utils/finance/goals'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './PlanningNavGrid.module.css'

const ITEM_META = {
  emergencyFund: { title: 'Emergency Fund', path: '/emergency-fund', icon: 'shield', accent: 'success' },
  goals: { title: 'Goals', path: '/goals', icon: 'flag', accent: 'purple' },
  budget: { title: 'Budget', path: '/budgets', icon: 'target', accent: 'warning' },
  financialFreedom: { title: 'Financial Freedom', path: '/financial-freedom', icon: 'compass', accent: 'info' },
}

// Compact navigation + status, not four large cards — each row answers
// "where do I stand" in one glance and links to the page that owns the
// full picture. Every number reuses useActionDashboardPlanning's own
// data (which itself reuses each feature's own calculations); the one new
// composition here is summarizeGoals(planning.goals.all), the same
// existing util the Goals page uses, just called again to get the
// remaining-by-currency total rather than re-deriving it.
const PlanningNavGrid = ({ summary, currency, loading }) => {
  const navigate = useNavigate()

  const goalsSummary = summary ? summarizeGoals(summary.goals.all) : null
  const primaryRemaining = goalsSummary?.remainingByCurrency.find((group) => group.currency === currency)
    ?? goalsSummary?.remainingByCurrency[0]

  const items = summary
    ? [
        {
          key: 'emergencyFund',
          status: !summary.emergencyFund.configured
            ? 'Not configured'
            : summary.emergencyFund.progress === null
              ? 'Getting started'
              : `${formatCurrency(summary.emergencyFund.current, currency)} / ${formatCurrency(summary.emergencyFund.target, currency)}`,
          percentage: summary.emergencyFund.progress,
        },
        {
          key: 'goals',
          status:
            goalsSummary.active === 0
              ? 'No active goals'
              : primaryRemaining
                ? `${goalsSummary.active} active · ${formatCurrency(primaryRemaining.remaining, primaryRemaining.currency)} remaining`
                : `${goalsSummary.active} active · ${goalsSummary.reached} reached`,
          percentage: null,
        },
        {
          key: 'budget',
          status:
            summary.budget.active === 0
              ? 'No budgets yet'
              : summary.budget.needingAttention === 0
                ? `${summary.budget.active} on track`
                : `${summary.budget.needingAttention} need${summary.budget.needingAttention === 1 ? 's' : ''} attention`,
          percentage: null,
        },
        {
          key: 'financialFreedom',
          status: !summary.financialFreedom.configured
            ? 'Not configured'
            : summary.financialFreedom.progress === null
              ? 'Awaiting spending data'
              : `${formatCurrency(summary.financialFreedom.target, currency)} estimated target`,
          percentage: summary.financialFreedom.progress,
        },
      ]
    : []

  return (
    <div className={styles.grid}>
      {Object.keys(ITEM_META).map((key) => {
        const meta = ITEM_META[key]
        const item = items.find((entry) => entry.key === key)

        return (
          <button key={key} type="button" className={styles.row} onClick={() => navigate(meta.path)}>
            <IconBox icon={meta.icon} accent={meta.accent} size="md" />
            <div className={styles.body}>
              <p className="text-card-title">{meta.title}</p>
              {loading ? (
                <Skeleton width="65%" height="0.75rem" />
              ) : (
                <p className="text-caption">{item.status}</p>
              )}
              {!loading && typeof item.percentage === 'number' && (
                <Progress percentage={item.percentage} label={`${meta.title} progress`} />
              )}
            </div>
            <Icon name="chevronRight" size="var(--icon-sm)" className={styles.arrow} />
          </button>
        )
      })}
    </div>
  )
}

export default PlanningNavGrid
