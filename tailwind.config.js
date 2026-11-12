/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        hairline: 'rgb(var(--c-hairline) / <alpha-value>)',
        subtle: 'rgb(var(--c-subtle) / <alpha-value>)',
        hover: 'rgb(var(--c-hover) / <alpha-value>)',
        raise: 'rgb(var(--c-raise) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        'danger-ink': 'rgb(var(--c-danger-ink) / <alpha-value>)',
        'danger-soft': 'rgb(var(--c-danger-soft) / <alpha-value>)',
        scrim: 'rgb(var(--c-scrim) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-app)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.04)',
        float: '0 12px 40px rgba(0, 0, 0, 0.16)',
        menu: '0 8px 28px rgba(0, 0, 0, 0.14)',
      },
      borderRadius: {
        card: '14px',
        field: '12px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'pop-in': 'pop-in 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-up': 'slide-up 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        'toast-in': 'toast-in 200ms cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
