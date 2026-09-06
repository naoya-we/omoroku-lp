/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./js/**/*.js"
  ],
  safelist: [
    'bg-red-500',
    'bg-gray-500',
    'text-cyan-400',
    'hidden',
    'opacity-0',
    'opacity-100',
    'pointer-events-none',
    'pointer-events-auto',
    'active',
    'facing-left',
    'state-idle',
    'state-walk',
    'state-run'
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          950: '#07070a',
          900: '#0e0e15',
          800: '#161622',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          red: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans JP"', 'sans-serif'],
        display: ['"Outfit"', '"Noto Sans JP"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
