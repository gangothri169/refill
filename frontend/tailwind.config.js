/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8ee9',
          600: '#0070c7',
          700: '#0159a1',
          800: '#064b84',
          900: '#0b3f6e',
          950: '#072849',
        },
        healthcare: {
          teal: '#0d9488',
          navy: '#0f172a',
          slate: '#334155',
          border: '#e2e8f0',
          bg: '#f8fafc',
          surface: '#ffffff',
          accent: '#2563eb',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#16a34a',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)',
        'glass-hover': '0 14px 40px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
        'glass-card': '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02), inset 0 1px 1px 0 rgba(255, 255, 255, 0.85)',
        'glass-modal': '0 25px 60px -15px rgba(15, 23, 42, 0.18), 0 0 1px 1px rgba(255, 255, 255, 0.9) inset',
        'apple-pill': '0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
        '3xl': '64px',
      }
    },
  },
  plugins: [],
}
