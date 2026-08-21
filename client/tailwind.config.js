/** @type {import('tailwindcss').Config} */
export default {
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
          300: '#7cc8fc',
          400: '#36abfa',
          500: '#0c8ef2',
          600: '#0070d4',
          700: '#0059ab',
          800: '#054b8d',
          900: '#0a3f74',
          950: '#07284d',
        },
        slate: {
          850: '#152033',
          950: '#0b1120',
        }
      },
    },
  },
  plugins: [],
}
