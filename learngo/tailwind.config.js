const daisyui = require('daisyui')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
    './screens/**/*.{js,jsx}',
    './data/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian:   { DEFAULT: '#0F172A', 800: '#131B2E' },
        navy:       { DEFAULT: '#1E293B', light: '#24304A', deep: '#0F172A' },
        orange:     { DEFAULT: '#FF7A00', light: '#F97316', glow: '#FF9A40' },
        emerald:    { DEFAULT: '#10B981' },
        cyan:       { DEFAULT: '#06B6D4' },
        slate:      { DEFAULT: '#94A3B8', light: '#CBD5E1' },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'card-glow': 'linear-gradient(135deg, rgba(255,122,0,0.08) 0%, rgba(6,182,212,0.04) 100%)',
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255,122,0,0.35)',
        'cyan-glow':   '0 0 20px rgba(6,182,212,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':       'float 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.3s ease-out',
        'fade-in':     'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float:    { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    // Single custom theme matching the LearnGo palette. Required by the brief
    // ("wajib memakai library komponen") and used for form controls, badges,
    // modals and progress bars.
    themes: [
      {
        learngo: {
          primary: '#FF7A00',
          'primary-content': '#ffffff',
          secondary: '#06B6D4',
          'secondary-content': '#ffffff',
          accent: '#10B981',
          'accent-content': '#ffffff',
          neutral: '#1E293B',
          'neutral-content': '#CBD5E1',
          'base-100': '#0F172A',
          'base-200': '#131B2E',
          'base-300': '#1E293B',
          'base-content': '#FFFFFF',
          info: '#38BDF8',
          'info-content': '#0F172A',
          success: '#10B981',
          'success-content': '#0F172A',
          warning: '#FF9A40',
          'warning-content': '#0F172A',
          error: '#EF4444',
          'error-content': '#FFFFFF',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.75rem',
          '--rounded-badge': '9999px',
          '--animation-btn': '0.2s',
          '--btn-focus-scale': '0.97',
        },
      },
    ],
    darkTheme: 'learngo',
    logs: false,
  },
}
