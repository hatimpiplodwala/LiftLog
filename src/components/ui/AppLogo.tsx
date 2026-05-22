interface AppLogoProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  return (
    <img
      src="/favicon.svg"
      alt="LiftLog"
      className={`${dim} rounded-lg ${className}`}
    />
  );
}
