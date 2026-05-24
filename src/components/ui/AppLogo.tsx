interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  glow?: boolean
}

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
}

export function AppLogo({ size = 'md', className = '', glow = false }: AppLogoProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-xl bg-primary/40 blur-xl"
        />
      )}
      <img
        src="/favicon.svg"
        alt="LiftLog"
        className={`${sizes[size]} rounded-md`}
      />
    </span>
  )
}
