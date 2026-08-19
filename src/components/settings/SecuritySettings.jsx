import Input from '../ui/Input'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import ConfirmModal from '../ui/ConfirmModal'
import SettingsRow from './SettingsRow'
import styles from './SecuritySettings.module.css'

// Reuses the same authenticated-user/logout-confirmation flow the Header
// uses (useActionAuth) — no re-implementation of auth or a second
// confirmation modal here. Account/session status are real (derived from
// there being a signed-in user at all), not fabricated detail.
const SecuritySettings = ({
  email,
  isLogoutConfirmOpen,
  onRequestLogout,
  onCancelLogout,
  onConfirmLogout,
  loggingOut,
  registerPassword,
  passwordErrors,
  onSubmitPasswordChange,
  changingPassword,
}) => (
  <div className={styles.stack}>
    <div>
      <SettingsRow icon="user" title="Email" value={email} />
      <SettingsRow icon="checkCircle" title="Account status" value="Active" />
      <SettingsRow icon="shield" title="Session status" value="Signed in" />
    </div>

    <div className={styles.passwordSection}>
      <p className="text-label">Change password</p>
      <form onSubmit={onSubmitPasswordChange} className={styles.passwordForm}>
        <Input
          id="newPassword"
          label="New password"
          type="password"
          helperText="At least 8 characters"
          error={passwordErrors.newPassword?.message}
          {...registerPassword('newPassword')}
        />
        <Input
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          error={passwordErrors.confirmPassword?.message}
          {...registerPassword('confirmPassword')}
        />
        <Button type="submit" variant="secondary" loading={changingPassword} className={styles.passwordSubmit}>
          Update password
        </Button>
      </form>
    </div>

    <Button variant="secondary" onClick={onRequestLogout} className={styles.logoutButton}>
      <Icon name="logout" size="var(--icon-sm)" />
      Log out
    </Button>

    <ConfirmModal
      isOpen={isLogoutConfirmOpen}
      onClose={onCancelLogout}
      onConfirm={onConfirmLogout}
      title="Log out?"
      message="Are you sure you want to log out?"
      confirmLabel="Log out"
      variant="danger"
      loading={loggingOut}
    />
  </div>
)

export default SecuritySettings
