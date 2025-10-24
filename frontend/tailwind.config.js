/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          dark: "#0A0F1C",
          accent: "#00FFFF",
          glow: "#12C2E9",
        },
      },
    },
  },
  plugins: [],
};
