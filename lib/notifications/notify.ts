// Browser notifications — free, no server needed.

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return await Notification.requestPermission()
}

export function showNotification(title: string, body: string, url = '/dashboard') {
  if (!notificationsSupported() || Notification.permission !== 'granted') return

  // Use service worker if available (more reliable, especially on mobile)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url },
        tag: 'ds-academy-reminder', // replaces previous, no spam
      } as any)
    }).catch(() => {
      // Fallback to basic notification
      new Notification(title, { body, icon: '/icon-192.png' })
    })
  } else {
    new Notification(title, { body, icon: '/icon-192.png' })
  }
}

// Schedule a daily reminder using localStorage to track last-shown
// (fires when the app is opened and it's been a day + past the reminder hour)
const REMINDER_KEY = 'ds-last-reminder'
const REMINDER_HOUR_KEY = 'ds-reminder-hour'

export function setReminderHour(hour: number) {
  localStorage.setItem(REMINDER_HOUR_KEY, String(hour))
}

export function getReminderHour(): number {
  return parseInt(localStorage.getItem(REMINDER_HOUR_KEY) || '19', 10) // default 7pm
}

// Call on app load — shows a reminder if it's a new day past the set hour
export function checkDailyReminder(opts: { streak: number; reviewsDue: number }) {
  if (getPermission() !== 'granted') return

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const lastShown = localStorage.getItem(REMINDER_KEY)
  const reminderHour = getReminderHour()

  // Only fire once per day, and only past the reminder hour
  if (lastShown === today) return
  if (now.getHours() < reminderHour) return

  let title = '🔥 Keep your streak alive!'
  let body = `You're on a ${opts.streak}-day streak. Don't break it — learn something today!`

  if (opts.streak === 0) {
    title = '📚 Time to learn'
    body = 'Start your Data Science streak today. Just one lesson counts!'
  } else if (opts.reviewsDue > 0) {
    title = '🧠 Reviews are waiting'
    body = `You have ${opts.reviewsDue} question${opts.reviewsDue > 1 ? 's' : ''} due for review. Lock in what you learned!`
  }

  showNotification(title, body)
  localStorage.setItem(REMINDER_KEY, today)
}