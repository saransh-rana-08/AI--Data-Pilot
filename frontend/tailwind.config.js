/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090a0d', // darkest background
          900: '#0f1115', // primary surface
          850: '#14171d', // card/panel surface
          800: '#1b1f27', // secondary elevated surface
          750: '#232832', // interactive hover
          700: '#2d3340', // border default
          600: '#404756', // subtle border / muted text
          400: '#7e879b', // secondary text
          200: '#c5cbdb', // primary text
          100: '#f1f3f9', // white/bright text
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          accent: '#818cf8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
}
