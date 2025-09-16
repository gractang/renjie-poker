/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        light: {
          text: "#1d3557",
          background: "#a8dadc",
          neutral: "#f1faee",
          accent: "#e63946",
        },
        dark: {
          text: "#f1faee",
          background: "#1d3557",
          neutral: "#457b9d",
          accent: "#e63946",
        },
      }, 
    },
  },
  plugins: [],
};