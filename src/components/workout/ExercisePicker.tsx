import { useMemo, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { SearchIcon } from '@/components/layout/Icons'
import { useExercises } from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import type { Category, Exercise } from '@/types/database.types'

const CATEGORIES: Array<Category | 'all'> = [
  'all',
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
]

interface Props {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
  excludeIds?: string[]
}

export function ExercisePicker({ open, onClose, onPick, excludeIds = [] }: Props) {
  const { data: exercises, isLoading } = useExercises()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<Category | 'all'>('all')

  const filtered = useMemo(() => {
    const ex = exercises ?? []
    const q = search.trim().toLowerCase()
    return ex.filter((e) => {
      if (excludeIds.includes(e.id)) return false
      if (cat !== 'all' && e.category !== cat) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, search, cat, excludeIds])

  return (
    <BottomSheet open={open} onClose={onClose} title="Add exercise">
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises"
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
                cat === c
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No exercises match.</p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  onPick(e)
                  onClose()
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left hover:bg-secondary"
              >
                <span className="text-sm font-medium text-foreground">{e.name}</span>
                <Badge variant="muted">{e.category}</Badge>
              </button>
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
