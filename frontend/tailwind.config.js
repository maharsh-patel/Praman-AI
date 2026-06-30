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
        brand: {
          50: '#f4f6ff',
          100: '#eaeeff',
          200: '#dce2ff',
          300: '#c3ccff',
          400: '#a1acff',
          500: '#7b83ff',
          600: '#5c5fff',
          700: '#4844eb',
          800: '#3b36c2',
          900: '#322f9b',
          950: '#1e1b5c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
