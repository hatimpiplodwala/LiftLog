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
import { Skeleton } from '@/components/ui/Skeleton'
import { Stat } from '@/components/ui/Stat'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { SearchIcon } from '@/components/layout/Icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useExercises } from '@/hooks/useExercises'
import { useBodyWeights } from '@/hooks/useBodyWeight'
import { fromKg } from '@/lib/utils'
import type { Category, Exercise, Units } from '@/types/database.types'

type Bucket = 'weekly' | 'monthly'
type Mode = 'volume' | 'exercise' | 'muscle' | 'bodyweight'

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

// Server-bounded to prevent unbounded growth; day-granular sinceKey keeps the cache stable within a session.
function useVolumeSets() {
  const { user } = useAuth()
  const since = subMonths(new Date(), 6)
  const sinceKey = format(since, 'yyyy-MM-dd')
  return useQuery({
    enabled: !!user,
    queryKey: ['volume-sets', user?.id, sinceKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, workouts!inner(user_id, finished_at)')
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .gte('workouts.finished_at', since.toISOString())
      if (error) throw error
      return data as unknown as SetRow[]
    },
  })
}

function useMuscleSets(enabled: boolean) {
  const { user } = useAuth()
  const since = subWeeks(new Date(), 12)
  const sinceKey = format(since, 'yyyy-MM-dd')
  return useQuery({
    enabled: !!user && enabled,
    queryKey: ['muscle-sets', user?.id, sinceKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select(
          'reps, weight_kg, workouts!inner(user_id, finished_at), exercises!inner(category)',
        )
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .gte('workouts.finished_at', since.toISOString())
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
  const { data: muscleSets, isLoading: muscleLoading } = useMuscleSets(mode === 'muscle')
  const { data: bodyWeights, isLoading: bwLoading } = useBodyWeights({
    enabled: mode === 'bodyweight',
  })

  const bodyWeightPoints = useMemo(() => {
    if (!bodyWeights) return [] as { label: string; weight: number; ts: number }[]
    return [...bodyWeights]
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      .map((l) => ({
        label: format(new Date(l.logged_at), 'MMM d'),
        weight: Math.round(fromKg(l.weight_kg, units) * 10) / 10,
        ts: new Date(l.logged_at).getTime(),
      }))
  }, [bodyWeights, units])
  const bwLatest = bodyWeightPoints.length
    ? bodyWeightPoints[bodyWeightPoints.length - 1].weight
    : 0
  const bwFirst = bodyWeightPoints.length ? bodyWeightPoints[0].weight : 0
  const bwDelta = Math.round((bwLatest - bwFirst) * 10) / 10

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
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'volume', label: 'Total' },
            { value: 'exercise', label: 'Exercise' },
            { value: 'muscle', label: 'Muscle' },
            { value: 'bodyweight', label: 'Body' },
          ]}
        />

        {mode === 'volume' ? (
          <>
            <SegmentedControl<Bucket>
              value={bucket}
              onChange={setBucket}
              options={[
                { value: 'weekly', label: 'weekly' },
                { value: 'monthly', label: 'monthly' },
              ]}
            />

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
                <Skeleton className="h-56 w-full" />
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
                    <Skeleton className="h-56 w-full" />
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
                <div className="relative">
                  <SearchIcon
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search exercises"
                    className="pl-9"
                  />
                </div>
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
        ) : mode === 'muscle' ? (
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
                <Skeleton className="h-56 w-full" />
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
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Latest"
                value={bwLatest > 0 ? String(bwLatest) : '—'}
                unit={bwLatest > 0 ? units : ''}
              />
              <Stat
                label="Change"
                value={
                  bodyWeightPoints.length < 2
                    ? '—'
                    : `${bwDelta > 0 ? '+' : ''}${bwDelta}`
                }
                unit={bodyWeightPoints.length >= 2 ? units : ''}
              />
            </div>

            <Card className="px-2 py-4">
              {bwLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : bodyWeightPoints.length === 0 ? (
                <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm font-medium text-foreground">No body weight logged</p>
                  <p className="text-xs text-muted-foreground">
                    Log entries from your Profile page to see the trend.
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={bodyWeightPoints}
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
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{
                          background: CHART_TOOLTIP_BG,
                          border: `1px solid ${CHART_TOOLTIP_BORDER}`,
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: CHART_AXIS }}
                        formatter={(value: number) => [`${value} ${units}`, 'Weight']}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
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
              Trend across all your logged body weight entries, in {units}.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
