import Switch from '../ui/Switch'
import SettingsRow from './SettingsRow'

const DOMAINS = [
  { key: 'recurring_transactions', label: 'Recurring transactions', description: 'Due and overdue reminders.', icon: 'calendarCheck' },
  { key: 'subscriptions', label: 'Subscriptions', description: 'Upcoming renewal reminders.', icon: 'refresh' },
  { key: 'budgets', label: 'Budgets', description: 'Approaching-limit and over-budget alerts.', icon: 'target' },
  { key: 'goals', label: 'Goals', description: 'Milestone and target-reached notices.', icon: 'flag' },
  { key: 'emergency_fund', label: 'Emergency fund', description: 'Milestone and target-reached notices.', icon: 'shield' },
  { key: 'financial_freedom', label: 'Financial freedom', description: 'Data-readiness notices.', icon: 'compass' },
  { key: 'investments', label: 'Investments', description: 'SIP due and overdue reminders.', icon: 'chartCandlestick' },
  { key: 'profile', label: 'Profile', description: 'Reminder to complete your financial profile.', icon: 'user' },
]

// Presentation only — every toggle here just flips one column in
// notification_preferences (the Task 19 table, reused as-is) via
// useActionSettings.toggleNotificationPreference. It never touches which
// notifications already exist, only whether new ones of that kind get
// created going forward, and a change here is picked up by the very next
// notification sync (same preferences row, same query key).
const NotificationSettings = ({ preferences, onToggle, saving }) => (
  <div>
    {DOMAINS.map((domain) => (
      <SettingsRow
        key={domain.key}
        icon={domain.icon}
        title={domain.label}
        description={domain.description}
        action={
          <Switch
            checked={preferences[domain.key] ?? true}
            onChange={() => onToggle(domain.key)}
            disabled={saving}
            label={`${domain.label} notifications`}
          />
        }
      />
    ))}
  </div>
)

export default NotificationSettings
