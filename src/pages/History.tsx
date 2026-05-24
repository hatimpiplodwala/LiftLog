import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInCalendarDays } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronRightIcon } from '@/components/layout/Icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useProfile } from '@/hooks/useProfile'
import { formatWeight, formatDuration, workoutDurationSecs } from '@/lib/utils'

interface SetSummary {
  workout_id: string
  exercise_id: string
  reps: number | null
  weight_kg: number | null
}

function useAllUserSets() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['history-sets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('workout_id, exercise_id, reps, weight_kg, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
      if (error) throw error
      return data as unknown as SetSummary[]
    },
  })
}

export function History() {
  const { data: profile } = useProfile()
  const units = profile?.units ?? 'kg'
  const { data: workouts, isLoading } = useWorkouts({ finishedOnly: true, limit: 100 })
  const { data: sets } = useAllUserSets()

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

  return (
    <div>
      <PageHeader title="History" subtitle="Your completed workouts" />

      <div className="space-y-2 px-4 pb-10 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !workouts || workouts.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
            <Link
              to="/workout/new"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Start your first workout →
            </Link>
          </Card>
        ) : (
          workouts.map((w) => {
            const s = summary.get(w.id)
            const date = new Date(w.started_at)
            const days = differenceInCalendarDays(new Date(), date)
            const dateLabel =
              days === 0 ? 'Today' : days === 1 ? 'Yesterday' : format(date, 'EEE, MMM d')
            return (
              <Link key={w.id} to={`/workout/${w.id}`}>
                <Card className="flex items-center gap-3 transition-colors hover:border-primary/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground">{w.name}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">{dateLabel}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDuration(workoutDurationSecs(w.started_at, w.finished_at))}</span>
                      <span>·</span>
                      <span>{s?.exerciseIds.size ?? 0} exercises</span>
                      <span>·</span>
                      <span>{s?.setCount ?? 0} sets</span>
                      {(s?.volumeKg ?? 0) > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {formatWeight(s!.volumeKg, units)} {units}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRightIcon className="shrink-0 text-muted-foreground" size={18} />
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
