/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'mobile': '640px',
        'tablet': '1024px',
        'desktop': '1280px',
      },
    },
  },
  plugins: [],
}
