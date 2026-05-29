import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatProps {
  label: string
  value: string
  unit?: string
  highlight?: boolean
}

// Shared metric tile used on the Dashboard and Progress pages so the
// label/value treatment stays identical everywhere.
export function Stat({ label, value, unit, highlight }: StatProps) {
  return (
    <Card className="px-3 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            'truncate font-display text-2xl font-extrabold tabular-nums',
            highlight ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </span>
        {unit && <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </Card>
  )
}
