export const isPushSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window

export const getPushPermission = () => {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export const requestPushPermission = async () => {
  if (!isPushSupported()) return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    return result
  } catch {
    return Notification.permission
  }
}

export const canShowPush = () => isPushSupported() && Notification.permission === 'granted'

export const showBrowserNotification = async (title, options = {}) => {
  if (!canShowPush()) return null

  const baseOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: options.tag ?? 'ffos-notification',
    renotify: false,
    ...options,
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration?.showNotification) {
        await registration.showNotification(title, baseOptions)
        return true
      }
    }
  } catch {
    // Fallback to window Notification
  }

  try {
    const n = new Notification(title, baseOptions)
    n.onclick = () => {
      window.focus()
      if (options.actionPath) window.location.href = options.actionPath
      n.close()
    }
    return n
  } catch {
    return null
  }
}

export const BROWSER_PUSH_STORAGE_KEY = 'ffos:browser_push_dedupe'

// Local dedupe for browser pushes (separate from DB dedupe_key) so we
// don't spam the OS notification center on every re-render.
export const shouldShowBrowserPush = (dedupeKey) => {
  if (!dedupeKey) return true
  try {
    const raw = localStorage.getItem(BROWSER_PUSH_STORAGE_KEY)
    const seen = raw ? JSON.parse(raw) : {}
    if (seen[dedupeKey]) return false
    return true
  } catch {
    return true
  }
}

export const markBrowserPushShown = (dedupeKey) => {
  if (!dedupeKey) return
  try {
    const raw = localStorage.getItem(BROWSER_PUSH_STORAGE_KEY)
    const seen = raw ? JSON.parse(raw) : {}
    seen[dedupeKey] = Date.now()
    // Keep only last 30 entries
    const entries = Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 30)
    localStorage.setItem(BROWSER_PUSH_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // ignore
  }
}
