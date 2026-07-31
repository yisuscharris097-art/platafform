import type { Config } from 'tailwindcss'

/**
 * All colors reference the CSS variables in globals.css — never hardcode a
 * color in a component. Type scale is fixed: 12/13/14/16/20/28. Weights 400
 * and 500 only.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      raised: 'var(--surface-raised)',
      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
      text: 'var(--text)',
      dim: 'var(--text-dim)',
      faint: 'var(--text-faint)',
      gold: 'var(--gold)',
      'gold-dim': 'var(--gold-dim)',
      'gold-wash': 'var(--gold-wash)',
      success: 'var(--success)',
      warn: 'var(--warn)',
      danger: 'var(--danger)',
    },
    fontSize: {
      '12': ['12px', '16px'],
      '13': ['13px', '18px'],
      '14': ['14px', '20px'],
      '16': ['16px', '24px'],
      '20': ['20px', '28px'],
      '28': ['28px', '34px'],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
    },
    borderRadius: {
      none: '0',
      sm: '6px',
      DEFAULT: '8px',
      lg: '12px',
      full: '9999px',
    },
    extend: {
      transitionDuration: { DEFAULT: '150ms' },
      transitionTimingFunction: { DEFAULT: 'ease-out' },
    },
  },
  plugins: [],
}

export default config
