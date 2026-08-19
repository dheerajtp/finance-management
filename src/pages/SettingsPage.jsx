import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'
import PageHeader from '../components/ui/PageHeader'
import SettingsSection from '../components/settings/SettingsSection'
import SettingsRow from '../components/settings/SettingsRow'
import AppearanceSettings from '../components/settings/AppearanceSettings'
import PreferencesSettings from '../components/settings/PreferencesSettings'
import NotificationSettings from '../components/settings/NotificationSettings'
import FinancialPreferencesSummary from '../components/settings/FinancialPreferencesSummary'
import SecuritySettings from '../components/settings/SecuritySettings'
import DataExportSettings from '../components/settings/DataExportSettings'
import useActionSettings from '../hooks/functionality/useActionSettings'
import styles from './SettingsPage.module.css'

const SettingsPage = () => {
  const {
    currentUser,
    profile,
    isLogoutConfirmOpen,
    requestLogout,
    cancelLogout,
    confirmLogout,
    loggingOut,
    themePreference,
    setThemePreference,
    dashboardPeriodPreference,
    setDashboardPeriodPreference,
    transactionDatePreference,
    setTransactionDatePreference,
    confirmBeforeDeleteTransaction,
    setConfirmBeforeDeleteTransaction,
    exportData,
    isExporting,
    isExportDataLoading,
    notificationPreferences,
    notificationPreferencesLoading,
    toggleNotificationPreference,
    savingNotificationPreference,
    accountsById,
    financialFreedomSettings,
    financialFreedomLoading,
    financialFreedomError,
    emergencyFundSettings,
    emergencyFundLoading,
    emergencyFundError,
    registerPassword,
    passwordErrors,
    submitPasswordChange,
    changingPassword,
  } = useActionSettings()

  return (
    <div className={styles.page}>
      <PageHeader title="Settings" description="Manage your account and application preferences." />

      <div className={styles.layout}>
        <div className={styles.main}>
          <SettingsSection icon="user" title="Profile" description="Your identity across Financial Freedom OS.">
            <SettingsRow icon="user" title="Name" value={profile?.name || 'Not set'} />
            <SettingsRow icon="inbox" title="Email" value={currentUser?.email} />
            <SettingsRow icon="wallet" title="Currency" value={profile?.currency ?? 'Not set'} />
            <Link to="/profile" className={styles.editProfileLink}>
              <Button variant="secondary">Edit profile</Button>
            </Link>
          </SettingsSection>

          <SettingsSection icon="sunMoon" title="Appearance" description="Choose how the application should appear.">
            <AppearanceSettings theme={themePreference} onChange={setThemePreference} />
          </SettingsSection>

          <SettingsSection icon="sliders" title="Preferences" description="Defaults used across the app.">
            <PreferencesSettings
              dashboardPeriod={dashboardPeriodPreference}
              onDashboardPeriodChange={setDashboardPeriodPreference}
              transactionDate={transactionDatePreference}
              onTransactionDateChange={setTransactionDatePreference}
              confirmBeforeDelete={confirmBeforeDeleteTransaction}
              onConfirmBeforeDeleteChange={setConfirmBeforeDeleteTransaction}
            />
          </SettingsSection>

          <SettingsSection icon="bell" title="Notifications" description="Choose which in-app reminders you want to receive.">
            {notificationPreferencesLoading ? (
              <Skeleton height="10rem" radius="var(--radius-md)" />
            ) : (
              <NotificationSettings
                preferences={notificationPreferences}
                onToggle={toggleNotificationPreference}
                saving={savingNotificationPreference}
              />
            )}
            <p className={`text-caption ${styles.emailNotice}`}>
              Email, SMS, and push notifications aren&rsquo;t available yet
              <Badge variant="neutral">Soon</Badge>
            </p>
          </SettingsSection>

          <SettingsSection icon="wallet" title="Financial Preferences" description="A summary of your financial configuration.">
            {financialFreedomLoading || emergencyFundLoading ? (
              <Skeleton height="16rem" radius="var(--radius-md)" />
            ) : (
              <FinancialPreferencesSummary
                profile={profile}
                fiSettings={financialFreedomSettings}
                fiError={financialFreedomError}
                efSettings={emergencyFundSettings}
                efError={emergencyFundError}
                accountsById={accountsById}
              />
            )}
          </SettingsSection>

          <SettingsSection icon="download" title="Data Management" description="Your data belongs to you.">
            <div className={styles.dataManagement}>
              <DataExportSettings onExport={exportData} exporting={isExporting} loading={isExportDataLoading} />
              <div className={styles.comingSoonRow}>
                <div>
                  <p className="text-body">Delete account</p>
                  <p className="text-caption">Permanently remove your account and data.</p>
                </div>
                <Badge variant="neutral">Coming soon</Badge>
              </div>
            </div>
          </SettingsSection>
        </div>

        <div className={styles.side}>
          <SettingsSection icon="shield" title="Security">
            <SecuritySettings
              email={currentUser?.email}
              isLogoutConfirmOpen={isLogoutConfirmOpen}
              onRequestLogout={requestLogout}
              onCancelLogout={cancelLogout}
              onConfirmLogout={confirmLogout}
              loggingOut={loggingOut}
              registerPassword={registerPassword}
              passwordErrors={passwordErrors}
              onSubmitPasswordChange={submitPasswordChange}
              changingPassword={changingPassword}
            />
          </SettingsSection>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
