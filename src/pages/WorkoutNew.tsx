import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronRightIcon, ListIcon, PlusIcon } from '@/components/layout/Icons'
import { useCreateWorkout } from '@/hooks/useWorkouts'
import { useTemplates } from '@/hooks/useTemplates'

const defaultName = () => `Session — ${format(new Date(), 'MMM d')}`

export function WorkoutNew() {
  const navigate = useNavigate()
  const [name, setName] = useState(defaultName())
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const createWorkout = useCreateWorkout()
  const { data: templates } = useTemplates()

  async function start() {
    setCreating(true)
    try {
      const workout = await createWorkout.mutateAsync({ name: name.trim() || defaultName() })
      const qs = templateId ? `?templateId=${templateId}` : ''
      navigate(`/workout/${workout.id}/active${qs}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start workout'
      toast.error(msg)
      setCreating(false)
    }
  }

  return (
    <div>
      <PageHeader title="New workout" back />
      <div className="space-y-5 px-4 pb-8 sm:px-6">
        <Card>
          <Input
            label="Workout name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName()}
          />
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold text-fg-muted">Start from a template</h2>
          {!templates ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-surface-2 p-2 text-fg-muted">
                  <ListIcon size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">No templates yet</div>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    Save a workout as a template after you finish one.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => {
                const selected = t.id === templateId
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(selected ? null : t.id)}
                    className={
                      'flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ' +
                      (selected
                        ? 'border-brand bg-brand-dim/20'
                        : 'border-border bg-surface hover:bg-surface-2')
                    }
                  >
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="mt-0.5 text-xs text-fg-muted">
                        {selected ? 'Selected · tap to deselect' : 'Tap to select'}
                      </div>
                    </div>
                    <ChevronRightIcon className="text-fg-dim" size={18} />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="pt-2">
          <Button size="lg" fullWidth loading={creating} onClick={start}>
            <PlusIcon size={18} /> Start workout
          </Button>
          <p className="mt-3 text-center text-xs text-fg-dim">
            You can add or remove exercises any time during your session.
          </p>
        </div>
      </div>
    </div>
  )
}
