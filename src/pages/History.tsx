import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInCalendarDays, startOfMonth, isAfter } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronRightIcon } from '@/components/layout/Icons'
import { WorkoutSummaryPane } from '@/components/workout/WorkoutSummaryPane'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useProfile } from '@/hooks/useProfile'
import { cn, formatWeight, formatDuration, workoutDurationSecs } from '@/lib/utils'

// On very wide screens (xl+) History is a master-detail view; a row click
// previews in the side pane instead of navigating. Below xl it navigates.
const DETAIL_MQ = '(min-width: 1280px)'

interface SetSummary {
  workout_id: string
  exercise_id: string
  reps: number | null
  weight_kg: number | null
}

// Scoped to the workouts the page actually renders (limit: 100) so total
// payload stays bounded as the user accumulates history. Sorted IDs in the
// queryKey keep the cache stable across renders that produce the same set.
function useSetsForWorkouts(workoutIds: string[] | undefined) {
  const key = useMemo(
    () => (workoutIds ? [...workoutIds].sort() : undefined),
    [workoutIds],
  )
  return useQuery({
    enabled: !!key && key.length > 0,
    queryKey: ['history-sets', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('workout_id, exercise_id, reps, weight_kg')
        .in('workout_id', key!)
      if (error) throw error
      return data as SetSummary[]
    },
  })
}

export function History() {
  const { data: profile } = useProfile()
  const units = profile?.units ?? 'kg'
  const { data: workouts, isLoading } = useWorkouts({ finishedOnly: true, limit: 100 })
  const workoutIds = useMemo(() => (workouts ?? []).map((w) => w.id), [workouts])
  const { data: sets } = useSetsForWorkouts(workoutIds)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Track whether we're in the master-detail (xl) layout so the detail pane
  // only mounts — and only fetches — when it's actually visible.
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DETAIL_MQ).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(DETAIL_MQ)
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  // Default the detail pane to the most recent workout so it's never empty.
  useEffect(() => {
    if (!selectedId && workouts && workouts.length > 0) setSelectedId(workouts[0].id)
  }, [workouts, selectedId])

  const summary = useMemo(() => {
    const map = new Map<string, { volumeKg: number; setCount: number; exerciseIds: Set<string> }>()
    for (const s of sets ?? []) {
      const entry = map.get(s.workout_id) ?? { volumeKg: 0, setCount: 0, exerciseIds: new Set<string>() }
      entry.setCount += 1
      entry.volumeKg += (s.reps ?? 0) * (s.weight_kg ?? 0)
      entry.exerciseIds.add(s.exercise_id)
      map.set(s.workout_id, entry)
    }
    return map
  }, [sets])

  const totals = useMemo(() => {
    const monthStart = startOfMonth(new Date())
    let volumeKg = 0
    for (const v of summary.values()) volumeKg += v.volumeKg
    const thisMonth = (workouts ?? []).filter(
      (w) => w.finished_at && isAfter(new Date(w.finished_at), monthStart),
    ).length
    return { count: workouts?.length ?? 0, volumeKg, thisMonth }
  }, [workouts, summary])

  return (
    <div>
      <PageHeader title="History" subtitle="Your completed workouts" />

      <div className="px-4 pb-10 sm:px-6">
        {!isLoading && workouts && workouts.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border pb-4 font-data text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{totals.count}</span> workouts
            </span>
            <span>
              <span className="font-semibold text-foreground">
                {formatWeight(totals.volumeKg, units)}
              </span>{' '}
              {units} volume
            </span>
            <span>
              <span className="font-semibold text-foreground">{totals.thisMonth}</span> this month
            </span>
          </div>
        )}
        <div className="xl:grid xl:grid-cols-[1fr_22rem] xl:divide-x xl:divide-border">
          <div className="min-w-0 xl:pr-6">
        {isLoading ? (
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 px-4 py-3.5">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            ))}
          </div>
        ) : !workouts || workouts.length === 0 ? (
          <EmptyState
            message="No workouts logged yet"
            action={
              <Link
                to="/workout/new"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Start your first workout
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-card">
            {/* Column header — wide screens only */}
            <div className="hidden border-b border-border px-4 py-2 font-data text-[11px] uppercase tracking-wider text-muted-foreground/70 lg:grid lg:grid-cols-[1fr_5rem_5.5rem_4rem_8rem_7rem] lg:items-center lg:gap-3">
              <span>Workout</span>
              <span className="text-right">Duration</span>
              <span className="text-right">Exercises</span>
              <span className="text-right">Sets</span>
              <span className="text-right">Volume</span>
              <span className="text-right">Date</span>
            </div>
            <div className="divide-y divide-border">
              {workouts.map((w) => {
                const s = summary.get(w.id)
                const date = new Date(w.started_at)
                const days = differenceInCalendarDays(new Date(), date)
                const dateLabel =
                  days === 0 ? 'Today' : days === 1 ? 'Yesterday' : format(date, 'EEE, MMM d')
                const duration = formatDuration(workoutDurationSecs(w.started_at, w.finished_at))
                const exercises = s?.exerciseIds.size ?? 0
                const setCount = s?.setCount ?? 0
                const volume = s?.volumeKg ?? 0
                return (
                  <Link
                    key={w.id}
                    to={`/workout/${w.id}`}
                    onClick={(e) => {
                      // On wide screens preview in the side pane instead of navigating.
                      if (isWide) {
                        e.preventDefault()
                        setSelectedId(w.id)
                      }
                    }}
                    className={cn(
                      'block px-4 py-3.5 transition-colors hover:bg-secondary/40',
                      selectedId === w.id && 'xl:bg-secondary/60',
                    )}
                  >
                    {/* Mobile: stacked */}
                    <div className="flex items-center gap-3 lg:hidden">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="truncate text-sm font-bold text-foreground">{w.name}</h3>
                          <span className="shrink-0 font-data text-xs text-muted-foreground">
                            {dateLabel}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-data text-xs text-muted-foreground">
                          <span>{duration}</span>
                          <span className="text-border">·</span>
                          <span>{exercises} exercises</span>
                          <span className="text-border">·</span>
                          <span>{setCount} sets</span>
                          {volume > 0 && (
                            <>
                              <span className="text-border">·</span>
                              <span>
                                {formatWeight(volume, units)} {units}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRightIcon className="shrink-0 text-muted-foreground" size={18} />
                    </div>

                    {/* Desktop: aligned columns */}
                    <div className="hidden lg:grid lg:grid-cols-[1fr_5rem_5.5rem_4rem_8rem_7rem] lg:items-center lg:gap-3">
                      <span className="truncate text-sm font-semibold text-foreground">{w.name}</span>
                      <span className="text-right font-data text-xs text-muted-foreground">{duration}</span>
                      <span className="text-right font-data text-xs text-muted-foreground">{exercises}</span>
                      <span className="text-right font-data text-xs text-muted-foreground">{setCount}</span>
                      <span className="text-right font-data text-xs text-muted-foreground">
                        {volume > 0 ? `${formatWeight(volume, units)} ${units}` : '—'}
                      </span>
                      <span className="text-right font-data text-xs text-muted-foreground">{dateLabel}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
          </div>

          <aside className="hidden xl:block xl:pl-6">
            <div className="xl:sticky xl:top-6">
              <WorkoutSummaryPane workoutId={isWide ? selectedId : null} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
