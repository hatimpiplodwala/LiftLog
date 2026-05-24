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
import { cn, fromKg } from '@/lib/utils'
import type { Category, Exercise, Units } from '@/types/database.types'

type Bucket = 'weekly' | 'monthly'
type Mode = 'volume' | 'exercise' | 'muscle'

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

interface MuscleSetRow {
  reps: number | null
  weight_kg: number | null
  workouts: { finished_at: string }
  exercises: { category: Category }
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

function useMuscleSets() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['muscle-sets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select(
          'reps, weight_kg, workouts!inner(user_id, finished_at), exercises!inner(category)',
        )
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
      if (error) throw error
      return data as unknown as MuscleSetRow[]
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

const CHART_AXIS = '#737373'
const CHART_GRID = '#1f1f1f'
const CHART_TOOLTIP_BG = '#0f0f0f'
const CHART_TOOLTIP_BORDER = '#262626'
const CHART_PRIMARY = '#10b981'

const CATEGORIES: Category[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']

const CATEGORY_COLORS: Record<Category, string> = {
  chest: '#10b981',
  back: '#3b82f6',
  legs: '#a855f7',
  shoulders: '#f59e0b',
  arms: '#ec4899',
  core: '#06b6d4',
  cardio: '#737373',
}

type MusclePoint = { label: string } & Record<Category, number>

function buildMuscleBuckets(sets: MuscleSetRow[], units: Units): MusclePoint[] {
  const weeks = 12
  const now = new Date()
  const thisWeek = startOfWeek(now, { weekStartsOn: 1 })
  const periods: { start: Date; label: string }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = subWeeks(thisWeek, i)
    periods.push({ start, label: format(start, 'MMM d') })
  }

  return periods.map(({ start, label }) => {
    const point = { label } as MusclePoint
    for (const c of CATEGORIES) point[c] = 0
    for (const s of sets) {
      const d = new Date(s.workouts.finished_at)
      if (!isSameWeek(d, start, { weekStartsOn: 1 })) continue
      const vol = (s.reps ?? 0) * (s.weight_kg ?? 0)
      if (vol === 0) continue
      const cat = s.exercises.category
      point[cat] = (point[cat] ?? 0) + vol
    }
    for (const c of CATEGORIES) {
      point[c] = Math.round(fromKg(point[c], units))
    }
    return point
  })
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
  const { data: muscleSets, isLoading: muscleLoading } = useMuscleSets()

  const points = useMemo(() => buildBuckets(sets ?? [], bucket, units), [sets, bucket, units])
  const total = points.reduce((s, p) => s + p.volume, 0)
  const peak = points.reduce((m, p) => Math.max(m, p.volume), 0)
  const allZero = peak === 0

  const exPoints = useMemo(
    () => (exSets ? buildExercisePoints(exSets, units) : []),
    [exSets, units],
  )
  const bestWeight = exPoints.reduce((m, p) => Math.max(m, p.maxWeight), 0)

  const musclePoints = useMemo(
    () => buildMuscleBuckets(muscleSets ?? [], units),
    [muscleSets, units],
  )
  const muscleAllZero =
    musclePoints.reduce(
      (sum, p) => sum + CATEGORIES.reduce((s, c) => s + (p[c] ?? 0), 0),
      0,
    ) === 0
  const categoryTotals = useMemo(() => {
    const totals: Record<Category, number> = {
      chest: 0, back: 0, legs: 0, shoulders: 0, arms: 0, core: 0, cardio: 0,
    }
    for (const p of musclePoints) {
      for (const c of CATEGORIES) totals[c] += p[c] ?? 0
    }
    return totals
  }, [musclePoints])
  const topCategory = useMemo(() => {
    let top: Category | null = null
    let topVal = 0
    for (const c of CATEGORIES) {
      if (categoryTotals[c] > topVal) {
        top = c
        topVal = categoryTotals[c]
      }
    }
    return top
  }, [categoryTotals])

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase()
    return (exercises ?? []).filter((e) => e.name.toLowerCase().includes(q))
  }, [exercises, search])

  return (
    <div>
      <PageHeader title="Progress" subtitle="Track your gains over time" />

      <div className="space-y-4 px-4 pb-10 sm:px-6">
        <div className="flex gap-1 rounded-md bg-secondary p-1">
          {(['volume', 'exercise', 'muscle'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 rounded-sm py-1.5 text-sm font-medium capitalize transition-colors',
                mode === m
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m === 'volume' ? 'Total' : m === 'exercise' ? 'Exercise' : 'Muscle'}
            </button>
          ))}
        </div>

        {mode === 'volume' ? (
          <>
            <div className="flex gap-1 rounded-md bg-secondary p-1">
              {(['weekly', 'monthly'] as Bucket[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  className={cn(
                    'flex-1 rounded-sm py-1.5 text-sm font-medium capitalize transition-colors',
                    bucket === b
                      ? 'bg-card text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
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
                  <p className="text-sm font-medium text-foreground">No volume yet</p>
                  <p className="text-xs text-muted-foreground">
                    Finish a workout to see your chart fill in.
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke={CHART_GRID} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: CHART_AXIS, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: CHART_GRID }}
                      />
                      <YAxis
                        tick={{ fill: CHART_AXIS, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                      />
                      <Tooltip
                        cursor={{ fill: CHART_GRID }}
                        contentStyle={{
                          background: CHART_TOOLTIP_BG,
                          border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: CHART_AXIS }}
                        formatter={(value: number) => [
                          `${value.toLocaleString()} ${units}`,
                          'Volume',
                        ]}
                      />
                      <Bar dataKey="volume" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <p className="px-1 text-xs text-muted-foreground">
              Volume = sum of (reps × weight) across every set in each{' '}
              {bucket === 'weekly' ? 'week' : 'month'}, in {units}.
            </p>
          </>
        ) : mode === 'exercise' ? (
          <>
            {selectedExercise ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Exercise progress
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold text-foreground">
                      {selectedExercise.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedExercise(null); setSearch('') }}
                    className="shrink-0 text-xs font-semibold text-primary hover:underline"
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
                      <p className="text-sm font-medium text-foreground">No data yet</p>
                      <p className="text-xs text-muted-foreground">
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
                          <CartesianGrid stroke={CHART_GRID} vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: CHART_AXIS, fontSize: 11 }}
                            tickLine={false}
                            axisLine={{ stroke: CHART_GRID }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: CHART_AXIS, fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                          />
                          <Tooltip
                            contentStyle={{
                              background: CHART_TOOLTIP_BG,
                              border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                            labelStyle={{ color: CHART_AXIS }}
                            formatter={(value: number, name: string) =>
                              name === 'maxWeight'
                                ? [`${value} ${units}`, 'Max weight']
                                : [value, 'Total reps']
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="maxWeight"
                            stroke={CHART_PRIMARY}
                            strokeWidth={2}
                            dot={{ fill: CHART_PRIMARY, r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <p className="px-1 text-xs text-muted-foreground">
                  Each point is the heaviest set logged in that session, in {units}.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search exercises…"
                  className="h-10 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="space-y-1">
                  {filteredExercises.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No exercises found.
                    </p>
                  ) : (
                    filteredExercises.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedExercise(e)}
                        className="flex w-full items-center justify-between rounded-md bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/60"
                      >
                        <span className="text-sm font-semibold text-foreground">{e.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {e.category}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Top group (12 wks)"
                value={topCategory ? topCategory : '—'}
                unit={topCategory ? categoryTotals[topCategory].toLocaleString() + ' ' + units : ''}
              />
              <Stat
                label="Total volume"
                value={CATEGORIES.reduce((s, c) => s + categoryTotals[c], 0).toLocaleString()}
                unit={units}
              />
            </div>

            <Card className="px-2 py-4">
              {muscleLoading ? (
                <div className="flex h-56 items-center justify-center">
                  <Spinner />
                </div>
              ) : muscleAllZero ? (
                <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm font-medium text-foreground">No volume yet</p>
                  <p className="text-xs text-muted-foreground">
                    Finish a strength workout to see your split.
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={musclePoints}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid stroke={CHART_GRID} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: CHART_AXIS, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: CHART_GRID }}
                      />
                      <YAxis
                        tick={{ fill: CHART_AXIS, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                      />
                      <Tooltip
                        cursor={{ fill: CHART_GRID }}
                        contentStyle={{
                          background: CHART_TOOLTIP_BG,
                          border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: CHART_AXIS }}
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString()} ${units}`,
                          name,
                        ]}
                      />
                      {CATEGORIES.map((c, idx) => (
                        <Bar
                          key={c}
                          dataKey={c}
                          stackId="muscle"
                          fill={CATEGORY_COLORS[c]}
                          radius={idx === CATEGORIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
              {CATEGORIES.map((c) => (
                <span key={c} className="flex items-center gap-1.5 capitalize">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: CATEGORY_COLORS[c] }}
                  />
                  {c}
                </span>
              ))}
            </div>

            <p className="px-1 text-xs text-muted-foreground">
              Weekly volume broken down by muscle group, in {units}. Cardio-type exercises only
              register when both reps and weight are logged.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="px-3 py-3">
      <div className="text-[11px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-extrabold tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </Card>
  )
}
