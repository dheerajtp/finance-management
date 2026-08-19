self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.actionPath || '/'
  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // eslint-disable-next-line no-undef
      if (clients.openWindow) return clients.openWindow(url)
      return null
    }),
  )
})

self.addEventListener('push', (event) => {
  // Fallback for real push events (FCM/Appwrite) if configured later.
  // Current daily reminder uses local Notification via showNotification from the page,
  // so this handler is just for completeness.
  if (!event.data) return
  try {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'Financial Freedom OS', {
        body: data.body || data.message || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { actionPath: data.actionPath || '/' },
      }),
    )
  } catch {
    // ignore
  }
})
