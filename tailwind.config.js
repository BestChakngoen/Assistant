/** @type {import('tailwindcss').Config} */
// Force rebuild cache invalidation 2026-06-12
export default {
  content: [
    "./*.html",
    "./learning-others/*.html",
    "./js/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'sans-serif'],
        mono: ['Rajdhani', 'monospace'],
      },
      colors: {
        game: {
          bg: '#0f172a',
          card: '#1e293b',
          success: '#22c55e',
          danger: '#ef4444',
        }
      },
      animation: {
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    }
  },
  plugins: [],
}
