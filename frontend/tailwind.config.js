/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sf: {
          dark: '#101b2d',
          navy: '#182338',
          teal: '#0e9f8e',
          'teal-dark': '#0b8878',
          'teal-light': '#eaf8f4',
          blue: '#3b82f6',
          bg: '#f4f7fb',
          card: '#ffffff',
          line: '#e7ecf3',
          muted: '#64748b',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#16a34a'
        }
      }
    },
  },
  plugins: [],
}
