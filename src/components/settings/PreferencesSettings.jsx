import Select from '../ui/Select'
import { DASHBOARD_PERIOD_OPTIONS } from '../../constants/dashboard'
import { TRANSACTION_DATE_DEFAULT_OPTIONS } from '../../constants/settings'
import styles from './PreferencesSettings.module.css'

// Every control here persists immediately and is wired to the page it
// affects (dashboard period default, transaction form date default, delete
// confirmation) — see useActionDashboard / useActionTransaction.
const PreferencesSettings = ({
  dashboardPeriod,
  onDashboardPeriodChange,
  transactionDate,
  onTransactionDateChange,
  confirmBeforeDelete,
  onConfirmBeforeDeleteChange,
}) => (
  <div className={styles.stack}>
    <div>
      <Select
        id="default-dashboard-period"
        label="Default dashboard period"
        options={DASHBOARD_PERIOD_OPTIONS}
        value={dashboardPeriod}
        onChange={(event) => onDashboardPeriodChange(event.target.value)}
      />
      <p className="text-caption">Which period the dashboard opens to.</p>
    </div>

    <div>
      <Select
        id="default-transaction-date"
        label="Default transaction date"
        options={TRANSACTION_DATE_DEFAULT_OPTIONS}
        value={transactionDate}
        onChange={(event) => onTransactionDateChange(event.target.value)}
      />
      <p className="text-caption">What the date field starts as when you add a transaction.</p>
    </div>

    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={confirmBeforeDelete}
        onChange={(event) => onConfirmBeforeDeleteChange(event.target.checked)}
      />
      Ask for confirmation before deleting a transaction
    </label>
  </div>
)

export default PreferencesSettings
