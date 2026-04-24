import type { Config } from "tailwindcss";

// Tailwind v4: kleuren worden geconfigureerd via @theme in globals.css
// Dit bestand documenteert de Tulpiaan huisstijl kleuren
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tulpiaan-goud": "#CBAD74",
        "tulpiaan-donkergoud": "#A68A52",
        "tulpiaan-zwart": "#1A1A1A",
        "tulpiaan-ivoor": "#F8F5EE",
        "tulpiaan-grijs": "#6B6B6B",
      },
      fontFamily: {
        heading: ["Aptos", "Calibri", "Arial", "sans-serif"],
        body: ["Aptos", "Calibri", "Arial", "sans-serif"],
        sans: ["Aptos", "Calibri", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
