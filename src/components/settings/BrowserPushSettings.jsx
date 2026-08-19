import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { isPushSupported, getPushPermission, requestPushPermission } from '../../utils/notifications/browserPush'
import styles from './BrowserPushSettings.module.css'

const BrowserPushSettings = () => {
  const [permission, setPermission] = useState(() => (isPushSupported() ? getPushPermission() : 'unsupported'))
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    setPermission(getPushPermission())
  }, [])

  const handleRequest = async () => {
    setRequesting(true)
    const result = await requestPushPermission()
    setPermission(result)
    setRequesting(false)
  }

  if (!isPushSupported()) {
    return <p className="text-caption">Browser push notifications are not supported in this browser.</p>
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div>
          <p className="text-body">Browser push notifications</p>
          <p className="text-caption">
            Get OS-level reminders for daily expenses even when the app is in the background. Requires permission.
          </p>
        </div>
        <Badge variant={permission === 'granted' ? 'success' : permission === 'denied' ? 'danger' : 'neutral'}>
          {permission}
        </Badge>
      </div>
      {permission === 'default' && (
        <Button onClick={handleRequest} loading={requesting} variant="secondary">
          Enable push notifications
        </Button>
      )}
      {permission === 'denied' && (
        <p className="text-caption">Permission denied. Enable notifications in your browser settings to receive daily expense reminders.</p>
      )}
      {permission === 'granted' && (
        <p className="text-caption">Push enabled. You’ll get an evening reminder if no expense is logged today.</p>
      )}
    </div>
  )
}

export default BrowserPushSettings
