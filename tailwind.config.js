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
      // Colors must stay `rgb(R G B / <alpha-value>)` or Tailwind cannot resolve
      // the alpha channel and silently drops every `/NN` variant (`bg-emerald/40`).
      // `DEFAULT` is a config key, not part of a class name: `bg-orange`,
      // `bg-navy/60`, never `bg-orange-DEFAULT`. The navy/indigo ramp is taken from
      // the Illustrator classes in public/learngo/Mockup*.svg: `.st0` page canvas,
      // `.st13` card fill, `.st3` raised pills, `.st4` hero cards, `.st33` hairlines.
      colors: {
        obsidian:   { DEFAULT: 'rgb(33 38 73 / <alpha-value>)',  800: 'rgb(27 32 68 / <alpha-value>)' },
        // `navy` = surface kartu #323868 (sidebar, panel). `navy-light` = canvas navy
        // #212649 untuk pill, kotak ikon, dan track progres.
        navy:       { DEFAULT: 'rgb(50 56 104 / <alpha-value>)', light: 'rgb(33 38 73 / <alpha-value>)', deep: 'rgb(27 32 68 / <alpha-value>)' },
        indigo:     { DEFAULT: 'rgb(49 54 104 / <alpha-value>)' },
        orange:     { DEFAULT: 'rgb(255 122 0 / <alpha-value>)', light: 'rgb(244 93 0 / <alpha-value>)', glow: 'rgb(248 139 48 / <alpha-value>)' },
        // `raised` = canvas navy untuk pill, kotak ikon, dan track progres.
        // Dipakai lewat `bg-raised` supaya track di atas kartu #323868 tetap terlihat.
        raised:     'rgb(33 38 73 / <alpha-value>)',
        gold:       { DEFAULT: 'rgb(240 208 128 / <alpha-value>)', light: 'rgb(255 240 213 / <alpha-value>)' },
        emerald:    { DEFAULT: 'rgb(16 185 129 / <alpha-value>)' },
        cyan:       { DEFAULT: 'rgb(56 189 248 / <alpha-value>)' },
        slate:      { DEFAULT: 'rgb(139 139 165 / <alpha-value>)', light: 'rgb(196 199 220 / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['var(--font-gummy)', 'Trebuchet MS', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        // Reference cards measure a ~20px radius, so `rounded-2xl` is the
        // default card shape throughout the app.
        xl:  '0.75rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      // Flat design: semua shadow/glow sengaja 'none'. Kelas seperti `shadow-card`
      // / `shadow-orange-glow` masih dipakai di komponen, tapi tidak memunculkan efek.
      boxShadow: {
        DEFAULT:       'none',
        'orange-glow': 'none',
        'cyan-glow':   'none',
        'card':        'none',
        'card-hover':  'none',
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
    // Single custom theme matching the LearnGo palette, required by the brief
    // ("wajib memakai library komponen"); drives form controls, badges, modals, progress bars.
    themes: [
      {
        learngo: {
          primary: '#FF7A00',
          'primary-content': '#ffffff',
          secondary: '#38BDF8',
          'secondary-content': '#0B0E1F',
          accent: '#10B981',
          'accent-content': '#0B0E1F',
          neutral: '#212649',
          'neutral-content': '#8B8CA5',
          'base-100': '#212649',
          'base-200': '#323868',
          'base-300': '#313668',
          'base-content': '#FFFFFF',
          info: '#38BDF8',
          'info-content': '#0B0E1F',
          success: '#10B981',
          'success-content': '#0B0E1F',
          warning: '#F0D080',
          'warning-content': '#0B0E1F',
          error: '#EA1B1B',
          'error-content': '#FFFFFF',
          '--rounded-box': '1.25rem',
          '--rounded-btn': '0.875rem',
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
