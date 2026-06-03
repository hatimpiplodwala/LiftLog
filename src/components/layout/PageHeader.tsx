import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ArrowLeftIcon } from './Icons'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
  accent?: boolean
}

export function PageHeader({ title, subtitle, back, right, accent }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-border px-4 pt-5 pb-4 sm:px-6 sm:pt-8">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="-ml-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeftIcon size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1
          className={cn(
            'font-display font-bold tracking-tight',
            accent ? 'text-3xl text-primary' : 'text-2xl text-foreground',
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
