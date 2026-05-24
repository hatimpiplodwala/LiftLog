import { useMemo } from 'react'
import { format, startOfWeek, addDays, subWeeks, isSameDay, isAfter } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  finishedAts: string[]
  weeks?: number
}

const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S']

export function HeatmapCalendar({ finishedAts, weeks = 12 }: Props) {
  const today = new Date()

  const countByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const ts of finishedAts) {
      const key = format(new Date(ts), 'yyyy-MM-dd')
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [finishedAts])

  const grid = useMemo(() => {
    const thisWeek = startOfWeek(today, { weekStartsOn: 1 })
    const firstWeek = subWeeks(thisWeek, weeks - 1)
    const cols: Date[][] = []
    for (let w = 0; w < weeks; w++) {
      const weekStart = addDays(firstWeek, w * 7)
      const days: Date[] = []
      for (let d = 0; d < 7; d++) days.push(addDays(weekStart, d))
      cols.push(days)
    }
    return cols
  }, [today, weeks])

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let lastMonth = -1
    grid.forEach((week, i) => {
      const m = week[0].getMonth()
      if (m !== lastMonth) {
        labels.push({ col: i, label: format(week[0], 'MMM') })
        lastMonth = m
      }
    })
    return labels
  }, [grid])

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1.5">
        <div className="ml-5 grid grid-flow-col auto-cols-[14px] gap-[3px] text-[10px] text-muted-foreground">
          {grid.map((_, i) => {
            const label = monthLabels.find((l) => l.col === i)
            return (
              <div key={i} className="h-3 whitespace-nowrap">
                {label?.label ?? ''}
              </div>
            )
          })}
        </div>
        <div className="flex gap-1">
          <div className="flex flex-col gap-[3px] pr-1 text-[9px] text-muted-foreground">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="flex h-[14px] w-3 items-center">
                {l}
              </div>
            ))}
          </div>
          <div className="grid grid-flow-col auto-cols-[14px] gap-[3px]">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-rows-7 gap-[3px]">
                {week.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const count = countByDay.get(key) ?? 0
                  const isFuture = isAfter(day, today) && !isSameDay(day, today)
                  return (
                    <div
                      key={key}
                      title={`${format(day, 'EEE, MMM d')} — ${count} workout${count === 1 ? '' : 's'}`}
                      className={cn(
                        'h-[14px] w-[14px] rounded-sm',
                        isFuture
                          ? 'bg-transparent'
                          : count === 0
                            ? 'bg-secondary/60'
                            : count === 1
                              ? 'bg-primary/40'
                              : count === 2
                                ? 'bg-primary/70'
                                : 'bg-primary',
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="ml-5 mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="h-3 w-3 rounded-sm bg-secondary/60" />
          <span className="h-3 w-3 rounded-sm bg-primary/40" />
          <span className="h-3 w-3 rounded-sm bg-primary/70" />
          <span className="h-3 w-3 rounded-sm bg-primary" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
