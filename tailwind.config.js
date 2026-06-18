/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bat: {
          blue: '#003087',
          gold: '#C9A84C',
          dark: '#0A0A1A',
          card: '#111827',
          border: '#1F2937',
        },
      },
    },
  },
  plugins: [],
}
