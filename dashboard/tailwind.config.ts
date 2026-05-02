import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0d12',
        surface: { DEFAULT: '#131820', 2: '#1a212c' },
        line: '#232a36',
        ink: { DEFAULT: '#e8eaed', dim: '#9aa3b2', faint: '#6b7280' },
        accent: { DEFAULT: '#f97316', soft: '#fb923c', glow: '#fbbf24' },
        ok: '#22c55e',
        warn: '#eab308',
        bad: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(249,115,22,0.18), 0 8px 30px -10px rgba(249,115,22,0.35)',
        card: '0 1px 0 rgba(255,255,255,0.05) inset, 0 0 0 1px rgba(255,255,255,0.035), 0 18px 40px -28px rgba(0,0,0,0.9)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
