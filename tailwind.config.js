/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  // CRITICAL: Manual toggle ke liye 'class' hona zaroori hai
  darkMode: 'class', 
  theme: {
    extend: {},
  },
  plugins: [],
}
