interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
}

export function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <img
        src="/favicon.svg"
        alt="LiftLog"
        className={`${sizes[size]} rounded-md`}
      />
    </span>
  )
}
