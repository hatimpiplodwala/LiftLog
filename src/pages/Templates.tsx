import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ChevronRightIcon, TrashIcon } from '@/components/layout/Icons'
import { cn } from '@/lib/utils'
import {
  useTemplates,
  useTemplateExercises,
  useDeleteTemplate,
} from '@/hooks/useTemplates'
import { useExercises } from '@/hooks/useExercises'
import { useCreateWorkout } from '@/hooks/useWorkouts'
import { format } from 'date-fns'

export function Templates() {
  const { data: templates, isLoading } = useTemplates()
  const deleteTemplate = useDeleteTemplate()
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <PageHeader title="Templates" subtitle="Reusable workout blueprints" />

      <div className="space-y-2 px-4 pb-10 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !templates || templates.length === 0 ? (
          <EmptyState
            message="No templates yet"
            hint={'Finish a workout and tap "Save as template" to create one.'}
          />
        ) : (
          templates.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              expanded={expanded === t.id}
              onToggle={() => setExpanded(expanded === t.id ? null : t.id)}
              onDelete={async () => {
                if (!confirm(`Delete template "${t.name}"?`)) return
                try {
                  await deleteTemplate.mutateAsync(t.id)
                  toast.success('Template deleted')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed')
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TemplateRow({
  template,
  expanded,
  onToggle,
  onDelete,
}: {
  template: { id: string; name: string; created_at: string }
  expanded: boolean
  onToggle: () => void
  onDelete: () => void | Promise<void>
}) {
  const navigate = useNavigate()
  const { data: items } = useTemplateExercises(expanded ? template.id : undefined)
  const { data: exercises } = useExercises()
  const createWorkout = useCreateWorkout()
  const [starting, setStarting] = useState(false)

  const exMap = new Map((exercises ?? []).map((e) => [e.id, e]))

  async function start() {
    setStarting(true)
    try {
      const w = await createWorkout.mutateAsync({ name: template.name })
      navigate(`/workout/${w.id}/active?templateId=${template.id}`)
    } catch (err) {
      setStarting(false)
      toast.error(err instanceof Error ? err.message : 'Failed to start')
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-secondary/40"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-foreground">{template.name}</div>
          <div className="mt-0.5 font-data text-xs text-muted-foreground">
            Created {format(new Date(template.created_at), 'MMM d, yyyy')}
          </div>
        </div>
        <ChevronRightIcon
          className={cn(
            'shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
          size={18}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border bg-secondary/30 p-4">
          {!items ? (
            <div className="flex justify-center py-2">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercises in this template.</p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              {items.map((it, i) => {
                const ex = exMap.get(it.exercise_id)
                return (
                  <div
                    key={it.id}
                    className="flex items-center justify-between px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-foreground">
                      <span className="mr-2 font-data text-muted-foreground">{i + 1}.</span>
                      {ex?.name ?? 'Unknown exercise'}
                    </span>
                    {ex && <Badge variant="muted">{ex.category}</Badge>}
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button loading={starting} onClick={start}>
              Start workout
            </Button>
            <Button variant="danger" onClick={onDelete}>
              <TrashIcon size={16} /> Delete
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
