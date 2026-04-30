/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3b82f6',
          secondary: '#7c3aed',
          dark: '#111827'
        },
        cream: {
          50: '#fdfbf3',
          100: '#faf6ec',
          200: '#f4ebd5',
          300: '#ecdfba',
          400: '#dfca94',
          500: '#c9ad6e',
          DEFAULT: '#faf6ec'
        }
      },
      fontFamily: {
        head: ['Chakra Petch', 'sans-serif'],
        body: ['IBM Plex Sans Thai', 'sans-serif']
      }
    }
  },
  plugins: []
}
