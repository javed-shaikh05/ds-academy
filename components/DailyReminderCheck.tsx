'use client'

import { useEffect } from 'react'
import { checkDailyReminder } from '@/lib/notifications/notify'

export default function DailyReminderCheck({ streak, reviewsDue }: { streak: number; reviewsDue: number }) {
  useEffect(() => {
    // Small delay so the page settles first
    const t = setTimeout(() => {
      checkDailyReminder({ streak, reviewsDue })
    }, 2000)
    return () => clearTimeout(t)
  }, [streak, reviewsDue])

  return null
}