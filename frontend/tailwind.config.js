/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          50: '#eef7f0',
          100: '#d6ecdb',
          200: '#aed9b8',
          300: '#7fbf8f',
          400: '#4fa066',
          500: '#2e7d32',
          600: '#256a29',
          700: '#1b5e20',
          800: '#154a1a',
          900: '#0f3513',
          950: '#0d2b20',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
