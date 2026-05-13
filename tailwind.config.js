/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        reader: {
          bg: 'var(--reader-bg)',
          text: 'var(--reader-text)',
          accent: 'var(--reader-accent)',
          sidebar: 'var(--reader-sidebar)',
          border: 'var(--reader-border)',
        },
        win: {
          bg: 'var(--bg)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          accent: 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          surface: 'var(--surface)',
          'surface-hover': 'var(--surface-hover)',
          border: 'var(--border)',
          'border-focus': 'var(--border-focus)',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Noto Serif SC', 'serif'],
        sans: ['Segoe UI Variable', 'Microsoft YaHei', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        'win-sm': 'var(--shadow-sm)',
        'win-md': 'var(--shadow-md)',
        'win-lg': 'var(--shadow-lg)',
      },
    }
  },
  plugins: []
}
