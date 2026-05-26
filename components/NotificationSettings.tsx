'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing, Check } from 'lucide-react'
import {
  notificationsSupported, getPermission, requestPermission,
  showNotification, setReminderHour, getReminderHour
} from '@/lib/notifications/notify'

export default function NotificationSettings() {
  const [permission, setPermission] = useState<string>('default')
  const [hour, setHour] = useState(19)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setPermission(getPermission())
    setHour(getReminderHour())
  }, [])

  if (!mounted) return null

  const enable = async () => {
    const result = await requestPermission()
    setPermission(result)
    if (result === 'granted') {
      // Show a test notification immediately so they know it works
      setTimeout(() => {
        showNotification('🎉 Notifications on!', 'You\'ll get a daily nudge to keep your streak going.')
      }, 500)
    }
  }

  const changeHour = (h: number) => {
    setHour(h)
    setReminderHour(h)
  }

  if (permission === 'unsupported') {
    return (
      <div className="glass p-4 text-sm text-gray-400 flex items-center gap-2">
        <BellOff className="w-4 h-4" /> Notifications aren&apos;t supported in this browser.
      </div>
    )
  }

  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-cyan-400" />
        <h2 className="font-semibold">Daily Reminders</h2>
      </div>

      {permission === 'granted' ? (
        <>
          <div className="flex items-center gap-2 text-sm text-green-400 mb-4">
            <Check className="w-4 h-4" /> Reminders are on
          </div>
          <p className="text-xs text-gray-400 mb-2">Remind me around:</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { h: 9, label: '9 AM' },
              { h: 13, label: '1 PM' },
              { h: 19, label: '7 PM' },
              { h: 21, label: '9 PM' },
            ].map((opt) => (
              <button
                key={opt.h}
                onClick={() => changeHour(opt.h)}
                className={`p-2 rounded-lg border text-xs transition ${
                  hour === opt.h
                    ? 'bg-linear-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => showNotification('🔔 Test', 'This is how your reminders will look!')}
            className="text-xs text-cyan-400 hover:underline"
          >
            Send a test notification
          </button>
        </>
      ) : permission === 'denied' ? (
        <p className="text-sm text-gray-400">
          Notifications are blocked. To enable, click the 🔒 icon in your browser&apos;s address bar → allow notifications → refresh.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-3">
            Get a daily nudge to keep your streak alive and review what&apos;s due.
          </p>
          <button
            onClick={enable}
            className="bg-linear-to-r from-cyan-500 to-violet-500 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition"
          >
            <BellRing className="w-4 h-4" /> Enable reminders
          </button>
        </>
      )}
    </div>
  )
}