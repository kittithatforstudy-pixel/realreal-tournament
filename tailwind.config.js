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
