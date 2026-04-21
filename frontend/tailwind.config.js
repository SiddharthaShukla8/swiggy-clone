/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff5200", // Swiggy 2.0 Vivid Orange
        'swiggy-orange': "#ff5200",
        secondary: "#282c3f", // Swiggy Deep Black
        accent: "#686b78", // Swiggy Muted Text
        surface: "#f1f1f6", 
        success: "#60b246", 
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        'premium': '0 8px 16px rgba(0,0,0,0.05)',
        'premium-hover': '0 12px 24px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
