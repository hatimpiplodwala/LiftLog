import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from './Icons'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
}

export function PageHeader({ title, subtitle, back, right }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-4 sm:px-6 sm:pt-8">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="-ml-1.5 rounded-lg p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Back"
        >
          <ArrowLeftIcon size={20} />
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
