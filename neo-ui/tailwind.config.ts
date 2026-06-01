import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      // ─── Colors mapped to CSS variables (theme-switchable) ──────────
      colors: {
        neo: {
          bg:        'var(--neo-bg)',
          'bg-alt':  'var(--neo-bg-alt)',
          surface:   'var(--neo-surface)',
          border:    'var(--neo-border)',
          text:      'var(--neo-text)',
          'text-dim':'var(--neo-text-dim)',
          accent:    'var(--neo-accent)',
          'accent-hover': 'var(--neo-accent-hover)',
          success:   'var(--neo-success)',
          warning:   'var(--neo-warning)',
          danger:    'var(--neo-danger)',
          info:      'var(--neo-info)',
          glow:      'var(--neo-glow)',
        },
      },

      // ─── Typography ─────────────────────────────────────────────────
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },

      // ─── Animations ─────────────────────────────────────────────────
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scan-line': 'scanLine 4s linear infinite',
        'data-flow': 'dataFlow 1.5s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px var(--neo-glow)' },
          '50%': { boxShadow: '0 0 20px var(--neo-glow), 0 0 40px var(--neo-glow)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        dataFlow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },

      // ─── Spacing & Layout ───────────────────────────────────────────
      borderRadius: {
        'neo': '0.75rem',
      },
      backdropBlur: {
        'neo': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
