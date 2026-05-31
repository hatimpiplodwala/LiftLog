import { format } from 'date-fns'

const DAY_MS = 86400_000

// Current consecutive-day workout streak from a list of finished-workout
// timestamps. Date keys use local time so a workout at 23:30 counts toward that
// day, not the next (must match HeatmapCalendar). Today not yet worked out still
// keeps the streak alive (grace day) — it only breaks once yesterday is missed.
export function computeStreak(finishedAts: string[]): number {
  if (finishedAts.length === 0) return 0
  const dateSet = new Set(finishedAts.map((d) => format(new Date(d), 'yyyy-MM-dd')))
  let streak = 0
  let cursor = new Date()
  if (!dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    cursor = new Date(cursor.getTime() - DAY_MS)
    if (!dateSet.has(format(cursor, 'yyyy-MM-dd'))) return 0
  }
  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = new Date(cursor.getTime() - DAY_MS)
  }
  return streak
}
