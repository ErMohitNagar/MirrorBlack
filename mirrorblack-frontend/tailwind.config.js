/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        black: {
          DEFAULT: '#0a0a0a',
          soft: '#111111',
          border: '#1e1e1e',
        },
        white: {
          DEFAULT: '#e8e8e8',
          muted: '#888888',
          faint: '#444444',
        },
        accent: {
          DEFAULT: '#4a6fa5',
          hover: '#3a5f95',
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
