import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FIScenarios.module.css'

const scenarioLabel = (multiplier) => (multiplier === 1 ? 'Current' : `+${Math.round((multiplier - 1) * 100)}%`)

const FIScenarios = ({ scenarios, currency }) => {
  return (
    <div>
      <p className="text-section-title">Scenario Comparison</p>
      <p className="text-caption">
        These are planning scenarios based on the selected assumptions. Actual investment returns, spending, income
        and taxes may differ.
      </p>
      <div className={styles.grid}>
        {scenarios.map((scenario) => (
          <Card key={scenario.multiplier} className={styles.card}>
            <p className="text-label">{scenarioLabel(scenario.multiplier)}</p>
            <p className="text-body">{formatCurrency(scenario.monthlyContribution, currency)}/month</p>
            <p className="text-metric">
              {scenario.projection ? `~${scenario.projection.years.toFixed(1)} years` : 'Not reached in 100 years'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default FIScenarios
