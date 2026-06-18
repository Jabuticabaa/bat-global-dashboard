/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bat: {
          blue: '#003087',
          gold: '#C9A84C',
          dark: '#0B0F1A',
          card: '#111827',
          elevated: '#1C2333',
          border: '#1F2937',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
      },
    },
  },
  plugins: [],
}
