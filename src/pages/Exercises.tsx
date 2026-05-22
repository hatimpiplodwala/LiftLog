import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { PlusIcon, SearchIcon, TrashIcon } from '@/components/layout/Icons'
import { useExercises, useCreateExercise, useDeleteExercise } from '@/hooks/useExercises'
import { useAuth } from '@/contexts/AuthContext'
import type { Category, ExerciseType } from '@/types/database.types'

const CATEGORIES: Array<Category | 'all'> = [
  'all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio',
]

const TYPES: ExerciseType[] = ['strength', 'cardio', 'bodyweight']

export function Exercises() {
  const { user } = useAuth()
  const { data: exercises, isLoading } = useExercises()
  const createExercise = useCreateExercise()
  const deleteExercise = useDeleteExercise()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [addOpen, setAddOpen] = useState(false)

  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('chest')
  const [newType, setNewType] = useState<ExerciseType>('strength')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const filtered = useMemo(() => {
    const ex = exercises ?? []
    const q = debouncedSearch.trim().toLowerCase()
    return ex.filter((e) => {
      if (cat !== 'all' && e.category !== cat) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [exercises, debouncedSearch, cat])

  async function onCreate() {
    if (!newName.trim()) {
      toast.error('Name is required')
      return
    }
    try {
      await createExercise.mutateAsync({
        name: newName.trim(),
        category: newCategory,
        type: newType,
      })
      toast.success('Exercise added')
      setAddOpen(false)
      setNewName('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Sets logged for it stay in your history.`)) return
    try {
      await deleteExercise.mutateAsync(id)
      toast.success('Deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle="Browse, search, and add your own"
        right={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon size={16} /> Add
          </Button>
        }
      />

      <div className="space-y-3 px-4 pb-10 sm:px-6">
        <div className="relative">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={
                'shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ' +
                (cat === c
                  ? 'border-brand bg-brand-dim/30 text-brand'
                  : 'border-border bg-surface-2 text-fg-muted hover:text-fg')
              }
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-fg-muted">No exercises match.</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((e) => {
              const isCustom = e.created_by === user?.id
              return (
                <Card key={e.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{e.name}</div>
                    <div className="mt-0.5 flex gap-1.5">
                      <Badge variant="muted">{e.category}</Badge>
                      <Badge variant="muted">{e.type}</Badge>
                      {isCustom && <Badge variant="brand">custom</Badge>}
                    </div>
                  </div>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => onDelete(e.id, e.name)}
                      disabled={deleteExercise.isPending}
                      className="rounded-md p-2 text-fg-dim hover:bg-surface-2 hover:text-danger disabled:opacity-50"
                      aria-label="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add custom exercise">
        <div className="space-y-4">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Cable Crunch"
            autoFocus
          />

          <div>
            <div className="mb-1.5 block text-sm font-medium text-fg-muted">Category</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c): c is Category => c !== 'all').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategory(c)}
                  className={
                    'rounded-full border px-3 py-1 text-xs font-medium capitalize ' +
                    (newCategory === c
                      ? 'border-brand bg-brand-dim/30 text-brand'
                      : 'border-border bg-surface-2 text-fg-muted')
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 block text-sm font-medium text-fg-muted">Type</div>
            <div className="flex gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize ' +
                    (newType === t
                      ? 'border-brand bg-brand-dim/30 text-brand'
                      : 'border-border bg-surface-2 text-fg-muted')
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth loading={createExercise.isPending} onClick={onCreate}>
            Add exercise
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
