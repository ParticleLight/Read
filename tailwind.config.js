/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        reader: {
          bg: 'var(--reader-bg)',
          text: 'var(--reader-text)',
          accent: 'var(--reader-accent)',
          sidebar: 'var(--reader-sidebar)',
          border: 'var(--reader-border)',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Noto Serif SC', 'serif'],
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
