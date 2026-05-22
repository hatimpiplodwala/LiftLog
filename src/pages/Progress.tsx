import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  startOfWeek,
  startOfMonth,
  format,
  subWeeks,
  subMonths,
  addWeeks,
  addMonths,
  isSameWeek,
  isSameMonth,
} from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useExercises } from '@/hooks/useExercises'
import { fromKg } from '@/lib/utils'
import type { Exercise, Units } from '@/types/database.types'

type Bucket = 'weekly' | 'monthly'
type Mode = 'volume' | 'exercise'

interface SetRow {
  reps: number | null
  weight_kg: number | null
  workouts: { finished_at: string | null; user_id: string }
}

interface ExerciseSetRow {
  reps: number | null
  weight_kg: number | null
  workouts: { finished_at: string }
}

function useVolumeSets() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['volume-sets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
      if (error) throw error
      return data as unknown as SetRow[]
    },
  })
}

function useExerciseSets(exerciseId: string | null) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user && !!exerciseId,
    queryKey: ['exercise-sets', exerciseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, workouts!inner(user_id, finished_at)')
        .eq('exercise_id', exerciseId!)
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .order('completed_at', { ascending: true })
      if (error) throw error
      return data as unknown as ExerciseSetRow[]
    },
  })
}

interface ChartPoint {
  label: string
  volume: number
}

function buildBuckets(sets: SetRow[], bucket: Bucket, units: Units): ChartPoint[] {
  const count = bucket === 'weekly' ? 12 : 6
  const now = new Date()
  const periods: { start: Date; label: string }[] = []

  if (bucket === 'weekly') {
    const thisWeek = startOfWeek(now, { weekStartsOn: 1 })
    for (let i = count - 1; i >= 0; i--) {
      const start = subWeeks(thisWeek, i)
      periods.push({ start, label: format(start, 'MMM d') })
    }
  } else {
    const thisMonth = startOfMonth(now)
    for (let i = count - 1; i >= 0; i--) {
      const start = subMonths(thisMonth, i)
      periods.push({ start, label: format(start, 'MMM') })
    }
  }

  return periods.map(({ start, label }) => {
    const next = bucket === 'weekly' ? addWeeks(start, 1) : addMonths(start, 1)
    const sumKg = sets.reduce((sum, s) => {
      if (!s.workouts.finished_at) return sum
      const d = new Date(s.workouts.finished_at)
      const inBucket =
        bucket === 'weekly'
          ? isSameWeek(d, start, { weekStartsOn: 1 })
          : isSameMonth(d, start)
      if (!inBucket) return sum
      if (d < start || d >= next) return sum
      return sum + (s.reps ?? 0) * (s.weight_kg ?? 0)
    }, 0)
    return { label, volume: Math.round(fromKg(sumKg, units)) }
  })
}

interface SessionPoint {
  label: string
  maxWeight: number
  totalReps: number
}

function buildExercisePoints(sets: ExerciseSetRow[], units: Units): SessionPoint[] {
  const byDate = new Map<string, { maxWeightKg: number; totalReps: number }>()
  for (const s of sets) {
    const date = format(new Date(s.workouts.finished_at), 'yyyy-MM-dd')
    const existing = byDate.get(date) ?? { maxWeightKg: 0, totalReps: 0 }
    existing.maxWeightKg = Math.max(existing.maxWeightKg, s.weight_kg ?? 0)
    existing.totalReps += s.reps ?? 0
    byDate.set(date, existing)
  }
  return Array.from(byDate.entries()).map(([date, { maxWeightKg, totalReps }]) => ({
    label: format(new Date(date), 'MMM d'),
    maxWeight: Math.round(fromKg(maxWeightKg, units) * 10) / 10,
    totalReps,
  }))
}

export function Progress() {
  const { data: profile } = useProfile()
  const units: Units = profile?.units ?? 'kg'
  const { data: sets, isLoading: volumeLoading } = useVolumeSets()
  const { data: exercises } = useExercises()
  const [bucket, setBucket] = useState<Bucket>('weekly')
  const [mode, setMode] = useState<Mode>('volume')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [search, setSearch] = useState('')

  const { data: exSets, isLoading: exLoading } = useExerciseSets(selectedExercise?.id ?? null)

  const points = useMemo(() => buildBuckets(sets ?? [], bucket, units), [sets, bucket, units])
  const total = points.reduce((s, p) => s + p.volume, 0)
  const peak = points.reduce((m, p) => Math.max(m, p.volume), 0)
  const allZero = peak === 0

  const exPoints = useMemo(
    () => (exSets ? buildExercisePoints(exSets, units) : []),
    [exSets, units],
  )
  const bestWeight = exPoints.reduce((m, p) => Math.max(m, p.maxWeight), 0)

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase()
    return (exercises ?? []).filter((e) => e.name.toLowerCase().includes(q))
  }, [exercises, search])

  return (
    <div>
      <PageHeader title="Progress" subtitle="Track your gains over time" />

      <div className="space-y-4 px-4 pb-10 sm:px-6">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          {(['volume', 'exercise'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                'flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ' +
                (mode === m ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg')
              }
            >
              {m === 'volume' ? 'Total volume' : 'By exercise'}
            </button>
          ))}
        </div>

        {mode === 'volume' ? (
          <>
            {/* Bucket toggle */}
            <div className="flex gap-1 rounded-lg bg-surface p-1">
              {(['weekly', 'monthly'] as Bucket[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  className={
                    'flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ' +
                    (bucket === b ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:text-fg')
                  }
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Stat
                label={`Total (${bucket === 'weekly' ? '12 wks' : '6 mo'})`}
                value={total.toLocaleString()}
                unit={units}
              />
              <Stat
                label={`Best ${bucket === 'weekly' ? 'week' : 'month'}`}
                value={peak.toLocaleString()}
                unit={units}
              />
            </div>

            <Card className="px-2 py-4">
              {volumeLoading ? (
                <div className="flex h-56 items-center justify-center">
                  <Spinner />
                </div>
              ) : allZero ? (
                <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm font-medium text-fg">No volume yet</p>
                  <p className="text-xs text-fg-muted">
                    Finish a workout to see your chart fill in.
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#262626" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#a3a3a3', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#262626' }}
                      />
                      <YAxis
                        tick={{ fill: '#a3a3a3', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                      />
                      <Tooltip
                        cursor={{ fill: '#1c1c1c' }}
                        contentStyle={{
                          background: '#141414',
                          border: '1px solid #262626',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#a3a3a3' }}
                        formatter={(value: number) => [
                          `${value.toLocaleString()} ${units}`,
                          'Volume',
                        ]}
                      />
                      <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <p className="px-1 text-xs text-fg-dim">
              Volume = sum of (reps × weight) across every set in each{' '}
              {bucket === 'weekly' ? 'week' : 'month'}, in {units}.
            </p>
          </>
        ) : (
          /* Exercise mode */
          <>
            {selectedExercise ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand">
                      Exercise progress
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold">{selectedExercise.name}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedExercise(null); setSearch('') }}
                    className="shrink-0 text-xs font-semibold text-brand hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Sessions" value={String(exPoints.length)} unit="total" />
                  <Stat
                    label="Best set"
                    value={bestWeight > 0 ? String(bestWeight) : '—'}
                    unit={bestWeight > 0 ? units : ''}
                  />
                </div>

                <Card className="px-2 py-4">
                  {exLoading ? (
                    <div className="flex h-56 items-center justify-center">
                      <Spinner />
                    </div>
                  ) : exPoints.length === 0 ? (
                    <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
                      <p className="text-sm font-medium text-fg">No data yet</p>
                      <p className="text-xs text-fg-muted">
                        Log this exercise in a workout to see your progress.
                      </p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 240 }}>
                      <ResponsiveContainer>
                        <LineChart
                          data={exPoints}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid stroke="#262626" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: '#a3a3a3', fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: '#262626' }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: '#a3a3a3', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                          />
                          <Tooltip
                            contentStyle={{
                              background: '#141414',
                              border: '1px solid #262626',
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            labelStyle={{ color: '#a3a3a3' }}
                            formatter={(value: number, name: string) =>
                              name === 'maxWeight'
                                ? [`${value} ${units}`, 'Max weight']
                                : [value, 'Total reps']
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="maxWeight"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <p className="px-1 text-xs text-fg-dim">
                  Each point is the heaviest set logged in that session, in {units}.
                </p>
              </>
            ) : (
              /* Exercise picker */
              <div className="space-y-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exercises…"
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-dim focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <div className="space-y-1">
                  {filteredExercises.length === 0 ? (
                    <p className="py-6 text-center text-sm text-fg-muted">No exercises found.</p>
                  ) : (
                    filteredExercises.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedExercise(e)}
                        className="flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="text-sm font-semibold">{e.name}</span>
                        <span className="text-xs text-fg-muted capitalize">{e.category}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="px-3 py-3">
      <div className="text-[11px] font-medium uppercase text-fg-dim">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold tabular-nums">{value}</span>
        {unit && <span className="text-xs text-fg-muted">{unit}</span>}
      </div>
    </Card>
  )
}
