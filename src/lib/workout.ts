// Shared workout-set math used across the active logging screen, the saved-detail
// view, and the public share page.

// Sum of reps × weight across sets (kg) — the app's canonical "volume" metric.
export function sumVolumeKg(
  sets: readonly { reps: number | null; weight_kg: number | null }[],
): number {
  return sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

// Group sets by exercise, preserving the order each exercise first appears.
export function groupSetsByExercise<T extends { exercise_id: string }>(
  sets: readonly T[],
): { exerciseId: string; sets: T[] }[] {
  const order: string[] = []
  const byId = new Map<string, T[]>()
  for (const s of sets) {
    let arr = byId.get(s.exercise_id)
    if (!arr) {
      arr = []
      byId.set(s.exercise_id, arr)
      order.push(s.exercise_id)
    }
    arr.push(s)
  }
  return order.map((exerciseId) => ({ exerciseId, sets: byId.get(exerciseId)! }))
}
