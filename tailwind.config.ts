import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        'surface-2': '#1c1c1c',
        border: '#262626',
        fg: '#fafafa',
        'fg-muted': '#a3a3a3',
        'fg-dim': '#737373',
        brand: {
          DEFAULT: '#10b981',
          hover: '#059669',
          dim: '#064e3b',
        },
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      animation: {
        'slide-up': 'slideUp 200ms ease-out',
        'fade-in': 'fadeIn 150ms ease-out',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
