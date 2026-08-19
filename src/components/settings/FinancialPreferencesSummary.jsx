import { Link } from 'react-router-dom'
import SettingsRow from './SettingsRow'
import ErrorState from '../ui/ErrorState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FinancialPreferencesSummary.module.css'

const NOT_CONFIGURED = 'Not configured'

// Pure presentation — every value here is read from data the caller already
// loaded (profile, financial freedom settings, emergency fund settings, an
// accounts lookup). No FI/EF/net-worth/savings-rate calculation happens in
// this file; those stay in their own feature modules.
const FinancialPreferencesSummary = ({ profile, fiSettings, fiError, efSettings, efError, accountsById }) => {
  const efAccountName = efSettings?.emergency_account_id ? accountsById[efSettings.emergency_account_id]?.name : null

  return (
    <div className={styles.stack}>
      <div>
        <SettingsRow
          icon="wallet"
          title="Primary currency"
          description="Used as the default currency across your financial planning."
          value={profile?.currency ?? NOT_CONFIGURED}
        />
        <SettingsRow
          icon="trendingUp"
          title="Monthly income"
          value={
            profile?.monthly_income !== null && profile?.monthly_income !== undefined
              ? formatCurrency(profile.monthly_income, profile.currency)
              : NOT_CONFIGURED
          }
        />
        <SettingsRow
          icon="target"
          title="Monthly savings target"
          value={
            profile?.monthly_savings_target ? formatCurrency(profile.monthly_savings_target, profile.currency) : NOT_CONFIGURED
          }
        />
        <Link to="/profile" className={styles.link}>
          Edit in Profile
        </Link>
      </div>

      <div className={styles.section}>
        <p className={`text-label ${styles.sectionTitle}`}>Financial Freedom</p>
        {fiError ? (
          <ErrorState message="Financial Freedom settings unavailable right now." />
        ) : (
          <>
            <SettingsRow icon="compass" title="FI analysis period" value={fiSettings ? `${fiSettings.analysis_months} months` : NOT_CONFIGURED} />
            <SettingsRow icon="compass" title="FI multiplier" value={fiSettings ? `${fiSettings.fi_multiplier}×` : NOT_CONFIGURED} />
            <SettingsRow
              icon="compass"
              title="Expected annual return"
              value={fiSettings ? `${fiSettings.expected_annual_return}%` : NOT_CONFIGURED}
            />
          </>
        )}
        <Link to="/financial-freedom" className={styles.link}>
          Financial Freedom
        </Link>
      </div>

      <div className={styles.section}>
        <p className={`text-label ${styles.sectionTitle}`}>Emergency Fund</p>
        {efError ? (
          <ErrorState message="Emergency fund settings unavailable right now." />
        ) : (
          <>
            <SettingsRow icon="shield" title="Target months" value={efSettings ? `${efSettings.target_months} months` : NOT_CONFIGURED} />
            <SettingsRow
              icon="shield"
              title="Monthly contribution"
              value={efSettings ? formatCurrency(efSettings.monthly_contribution, profile?.currency) : NOT_CONFIGURED}
            />
            <SettingsRow icon="shield" title="Selected account" value={efAccountName ?? NOT_CONFIGURED} />
          </>
        )}
        <Link to="/emergency-fund" className={styles.link}>
          Emergency Fund
        </Link>
      </div>
    </div>
  )
}

export default FinancialPreferencesSummary
